package app.petlog.diario;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * «Anotar por voz» en ventana flotante: lo abre el atajo al mantener pulsado el icono de PetLog.
 *
 * Es una actividad transparente, en su propia tarea y fuera de «Recientes», que carga la misma app web en modo
 * rápido (QuickVoicePlugin.isQuick → true): solo el micrófono y el resultado, sobre la pantalla en la que estaba
 * el usuario. Guarda en la misma base de datos que PetLog. Se cierra sola al terminar o con «atrás».
 */
public class QuickVoiceActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VoicePlugin.class);
        registerPlugin(QuickVoicePlugin.class);
        super.onCreate(savedInstanceState);
        // La web pinta sus propias ventanas: el resto debe dejar ver lo que hay detrás.
        WebView wv = getBridge() != null ? getBridge().getWebView() : null;
        if (wv != null) wv.setBackgroundColor(Color.TRANSPARENT);
    }

    /** Si el usuario sale (inicio, otra app), la ventana no se queda escondida: se cierra. */
    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        finish();
    }

    @Override
    public void finish() {
        super.finish();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
}
