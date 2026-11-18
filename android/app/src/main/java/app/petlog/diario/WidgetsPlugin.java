package app.petlog.diario;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

/** Recibe de la app la mascota y los botones que muestran los widgets. */
@CapacitorPlugin(name = "Widgets")
public class WidgetsPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        try {
            String petId = call.getString("petId");
            String petName = call.getString("petName", "");
            JSArray items = call.getArray("items", new JSArray());
            int n = Math.min(3, items.length());
            String[] ids = new String[n];
            String[] labels = new String[n];
            String[] pngs = new String[n];
            for (int i = 0; i < n; i++) {
                JSONObject o = items.getJSONObject(i);
                ids[i] = o.getString("typeId");
                labels[i] = o.optString("label", "");
                pngs[i] = o.has("png") ? o.getString("png") : null;
            }
            WidgetStore.save(getContext(), petId, petName, ids, labels, pngs);
            QuickWidget.refresh(getContext());
            VoiceWidget.refresh(getContext());
            call.resolve(new JSObject());
        } catch (Exception e) {
            call.reject("No se pudo actualizar el widget", e);
        }
    }
}
