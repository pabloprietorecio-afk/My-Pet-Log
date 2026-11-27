package app.petlog.diario;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppIconPlugin.class);
        registerPlugin(VoicePlugin.class);
        registerPlugin(WidgetsPlugin.class);
        registerPlugin(ShortcutPlugin.class);
        registerPlugin(QuickVoicePlugin.class);
        super.onCreate(savedInstanceState);
        // Atajo «Anotar por voz» al mantener pulsado el icono (ver VoiceShortcut).
        VoiceShortcut.ensure(this);
    }
}
