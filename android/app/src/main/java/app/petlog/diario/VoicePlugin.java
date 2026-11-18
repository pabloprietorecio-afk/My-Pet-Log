package app.petlog.diario;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.Locale;

/**
 * Dictado y voz para PetLog.
 *
 * Orden de preferencia: reconocimiento en el propio teléfono (Android 12+, si el idioma está descargado), luego el
 * servicio de voz del sistema (puede usar la red, según el teléfono) y, si nada de eso funciona, la ventana de
 * dictado de Android. El texto se envía a la app mientras se habla («partial») junto con el nivel del micrófono.
 */
@CapacitorPlugin(
    name = "Voice",
    permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone") }
)
public class VoicePlugin extends Plugin {

    private SpeechRecognizer recognizer;
    private PluginCall pending;
    private String partial = "";
    private boolean usedOnDevice = false;
    private boolean busyRetried = false;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private String ttsQueued;

    @PluginMethod
    public void available(PluginCall call) {
        JSObject r = new JSObject();
        r.put("recognition", SpeechRecognizer.isRecognitionAvailable(getContext()) || hasDictationActivity());
        r.put("onDevice", Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext()));
        r.put("permission", getPermissionState("microphone").toString().toLowerCase(Locale.ROOT));
        call.resolve(r);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "micPermission");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void micPermission(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) begin(call);
        else call.reject("Sin permiso de micrófono", "permission");
    }

    private void begin(PluginCall call) {
        if (pending != null) {
            pending.reject("Cancelado", "cancelled");
        }
        pending = call;
        call.setKeepAlive(true);
        partial = "";
        busyRetried = false;
        getActivity().runOnUiThread(() -> {
            boolean onDevice = Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext());
            if (onDevice) listen(true);
            else if (SpeechRecognizer.isRecognitionAvailable(getContext())) listen(false);
            else dialog();
        });
    }

    private Intent recognizeIntent(boolean partials) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        String lang = pending != null ? pending.getString("lang", "es-ES") : "es-ES";
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
        if (partials) intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        return intent;
    }

    private void listen(boolean onDevice) {
        destroyRecognizer();
        usedOnDevice = onDevice;
        try {
            recognizer = onDevice && Build.VERSION.SDK_INT >= 31
                ? SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext())
                : SpeechRecognizer.createSpeechRecognizer(getContext());
        } catch (Exception e) {
            if (onDevice) listen(false);
            else dialog();
            return;
        }
        recognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) { state("listening"); }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float rmsdB) {
                JSObject o = new JSObject();
                o.put("level", Math.max(0f, Math.min(1f, (rmsdB + 2f) / 12f)));
                notifyListeners("level", o);
            }
            @Override public void onBufferReceived(byte[] buffer) { }
            @Override public void onEndOfSpeech() { state("processing"); }
            @Override public void onEvent(int eventType, Bundle params) { }

            @Override public void onPartialResults(Bundle b) {
                ArrayList<String> r = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (r != null && !r.isEmpty() && r.get(0) != null && !r.get(0).trim().isEmpty()) {
                    partial = r.get(0);
                    JSObject o = new JSObject();
                    o.put("text", partial);
                    notifyListeners("partial", o);
                }
            }

            @Override public void onResults(Bundle b) {
                ArrayList<String> r = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                ArrayList<String> all = new ArrayList<>();
                if (r != null) for (String s : r) if (s != null && !s.trim().isEmpty()) all.add(s.trim());
                if (all.isEmpty() && !partial.trim().isEmpty()) all.add(partial.trim());
                destroyRecognizer();
                finish(all, usedOnDevice ? "device" : "service");
            }

            @Override public void onError(int error) {
                String heard = partial.trim();
                destroyRecognizer();
                // 12/13: el idioma no está descargado para el reconocimiento en el teléfono → servicio normal.
                if (usedOnDevice && (error == 12 || error == 13 || error == SpeechRecognizer.ERROR_CLIENT || error == 14)) {
                    listen(false);
                    return;
                }
                if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                    ArrayList<String> all = new ArrayList<>();
                    if (!heard.isEmpty()) all.add(heard);
                    finish(all, usedOnDevice ? "device" : "service");
                    return;
                }
                if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY && !busyRetried) {
                    busyRetried = true;
                    getActivity().getWindow().getDecorView().postDelayed(() -> listen(usedOnDevice), 400);
                    return;
                }
                if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                    fail("Sin permiso de micrófono", "permission");
                    return;
                }
                if (error == SpeechRecognizer.ERROR_NETWORK || error == SpeechRecognizer.ERROR_NETWORK_TIMEOUT) {
                    fail("El dictado necesita conexión en este teléfono", "network");
                    return;
                }
                dialog();
            }
        });
        recognizer.startListening(recognizeIntent(true));
    }

    /** Último recurso: la ventana de dictado de Android. */
    private void dialog() {
        if (pending == null) return;
        if (!hasDictationActivity()) {
            fail("Este teléfono no tiene reconocimiento de voz", "unavailable");
            return;
        }
        state("dialog");
        startActivityForResult(pending, recognizeIntent(false), "dialogResult");
    }

    @ActivityCallback
    private void dialogResult(PluginCall call, ActivityResult result) {
        ArrayList<String> all = new ArrayList<>();
        Intent data = result.getData();
        if (data != null) {
            ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (r != null) for (String s : r) if (s != null && !s.trim().isEmpty()) all.add(s.trim());
        }
        finish(all, "dialog");
    }

    private boolean hasDictationActivity() {
        return new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).resolveActivity(getContext().getPackageManager()) != null;
    }

    private void state(String s) {
        JSObject o = new JSObject();
        o.put("state", s);
        notifyListeners("state", o);
    }

    private void finish(ArrayList<String> all, String engine) {
        PluginCall call = pending;
        pending = null;
        if (call == null) return;
        JSObject r = new JSObject();
        r.put("text", all.isEmpty() ? "" : all.get(0));
        r.put("alternatives", new JSArray(all));
        r.put("engine", engine);
        call.resolve(r);
        call.setKeepAlive(false);
        getBridge().releaseCall(call);
    }

    private void fail(String msg, String code) {
        PluginCall call = pending;
        pending = null;
        if (call == null) return;
        call.reject(msg, code);
        call.setKeepAlive(false);
        getBridge().releaseCall(call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (recognizer != null) recognizer.stopListening();
            call.resolve();
        });
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            destroyRecognizer();
            fail("Cancelado", "cancelled");
            call.resolve();
        });
    }

    private void destroyRecognizer() {
        if (recognizer != null) {
            try {
                recognizer.cancel();
                recognizer.destroy();
            } catch (Exception ignored) { }
            recognizer = null;
        }
    }

    /** Lee en voz alta una confirmación corta («Anotado: vómito leve»). */
    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        if (text == null || text.isEmpty()) {
            call.resolve();
            return;
        }
        if (tts == null) {
            ttsQueued = text;
            tts = new TextToSpeech(getContext(), status -> {
                ttsReady = status == TextToSpeech.SUCCESS;
                if (ttsReady) {
                    tts.setLanguage(new Locale("es", "ES"));
                    if (ttsQueued != null) tts.speak(ttsQueued, TextToSpeech.QUEUE_FLUSH, null, "petlog");
                    ttsQueued = null;
                }
            });
        } else if (ttsReady) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "petlog");
        } else {
            ttsQueued = text;
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        destroyRecognizer();
        if (tts != null) {
            tts.shutdown();
            tts = null;
        }
        super.handleOnDestroy();
    }
}
