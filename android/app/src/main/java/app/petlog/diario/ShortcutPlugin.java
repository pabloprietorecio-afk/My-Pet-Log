package app.petlog.diario;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Estado del atajo «Anotar por voz» (para mostrarlo en Ajustes y poder comprobarlo en el móvil). */
@CapacitorPlugin(name = "Shortcut")
public class ShortcutPlugin extends Plugin {
    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("ensure", VoiceShortcut.ensure(getContext()));
        r.put("state", VoiceShortcut.state(getContext()));
        call.resolve(r);
    }
}
