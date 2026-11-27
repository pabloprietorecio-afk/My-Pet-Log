package app.petlog.diario;

import android.app.Activity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Puente de la ventana flotante de voz (ver QuickVoiceActivity y src/platform/quick.ts). */
@CapacitorPlugin(name = "QuickVoice")
public class QuickVoicePlugin extends Plugin {

    /** ¿Esta web se está mostrando en la ventana flotante? */
    @PluginMethod
    public void isQuick(PluginCall call) {
        JSObject r = new JSObject();
        r.put("quick", getActivity() instanceof QuickVoiceActivity);
        call.resolve(r);
    }

    /** Cierra la ventana flotante. */
    @PluginMethod
    public void close(PluginCall call) {
        Activity a = getActivity();
        call.resolve();
        if (a instanceof QuickVoiceActivity) a.runOnUiThread(a::finish);
    }

    /** Abre PetLog completo en un enlace petlog://abrir/… y cierra la ventana flotante. */
    @PluginMethod
    public void openApp(PluginCall call) {
        String url = call.getString("url", "petlog://abrir/");
        Activity a = getActivity();
        a.startActivity(WidgetLinks.view(a, url));
        call.resolve();
        if (a instanceof QuickVoiceActivity) a.runOnUiThread(a::finish);
    }
}
