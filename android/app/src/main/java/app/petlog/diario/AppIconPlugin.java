package app.petlog.diario;

import android.content.ComponentName;
import android.content.pm.PackageManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Cambia el icono de la app activando uno de los activity-alias declarados en el manifiesto.
 * Solo puede elegir iconos incluidos en el APK; no descarga ni genera nada.
 */
@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {

    private static final String[] KINDS = {"cat", "dog", "rabbit", "rodent", "bird", "reptile"};

    private ComponentName alias(String kind) {
        String cls = "Icon" + Character.toUpperCase(kind.charAt(0)) + kind.substring(1);
        return new ComponentName(getContext().getPackageName(), "app.petlog.diario." + cls);
    }

    private boolean isEnabled(PackageManager pm, String kind) {
        int state = pm.getComponentEnabledSetting(alias(kind));
        if (state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT) return kind.equals("cat");
        return state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED;
    }

    @PluginMethod
    public void get(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        String current = "cat";
        for (String k : KINDS) {
            if (isEnabled(pm, k)) { current = k; break; }
        }
        JSObject ret = new JSObject();
        ret.put("kind", current);
        call.resolve(ret);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String kind = call.getString("kind", "cat");
        boolean valid = false;
        for (String k : KINDS) if (k.equals(kind)) valid = true;
        if (!valid) { call.reject("Icono desconocido: " + kind); return; }
        PackageManager pm = getContext().getPackageManager();
        try {
            // Primero se activa el nuevo y después se desactivan los demás, para que nunca quede la app sin icono.
            pm.setComponentEnabledSetting(alias(kind), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
            for (String k : KINDS) {
                if (!k.equals(kind)) {
                    pm.setComponentEnabledSetting(alias(k), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
                }
            }
            JSObject ret = new JSObject();
            ret.put("kind", kind);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("No se pudo cambiar el icono", e);
        }
    }
}
