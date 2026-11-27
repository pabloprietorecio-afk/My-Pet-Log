package app.petlog.diario;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;

import java.util.Collections;

/**
 * Atajo «Anotar por voz» al mantener pulsado el icono de PetLog. Abre la ventana flotante de voz
 * (QuickVoiceActivity), sin abrir la app.
 *
 * El atajo fijo está en res/xml/shortcuts.xml (meta-data de cada activity-alias del lanzador). Si el sistema no lo ha
 * publicado (getManifestShortcuts no lo devuelve), la app publica uno equivalente por código al abrirse, para que el
 * lanzador lo tenga igualmente. Nunca se publican los dos a la vez.
 */
final class VoiceShortcut {
    private VoiceShortcut() { }

    static final String MANIFEST_ID = "voz";
    static final String DYNAMIC_ID = "voz-app";

    /** @return "manifest", "dynamic", "unsupported" o "error: …" */
    static String ensure(Context ctx) {
        if (Build.VERSION.SDK_INT < 25) return "unsupported";
        try {
            ShortcutManager sm = ctx.getSystemService(ShortcutManager.class);
            if (sm == null) return "unsupported";
            boolean manifest = false;
            for (ShortcutInfo s : sm.getManifestShortcuts()) if (MANIFEST_ID.equals(s.getId())) manifest = true;
            if (manifest) {
                // Un atajo dinámico de una versión anterior (que abría la app) se sustituye por el fijo.
                sm.removeDynamicShortcuts(Collections.singletonList(DYNAMIC_ID));
                return "manifest";
            }
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("petlog://voz-rapida"));
            intent.setClass(ctx, QuickVoiceActivity.class);
            ShortcutInfo info = new ShortcutInfo.Builder(ctx, DYNAMIC_ID)
                .setShortLabel(ctx.getString(R.string.voice_label))
                .setLongLabel(ctx.getString(R.string.voice_label))
                .setIcon(Icon.createWithResource(ctx, R.drawable.ic_voice_face))
                .setIntent(intent)
                .build();
            sm.setDynamicShortcuts(Collections.singletonList(info));
            return "dynamic";
        } catch (Exception e) {
            return "error: " + e.getClass().getSimpleName() + " " + e.getMessage();
        }
    }

    /** Qué ve el sistema ahora mismo (para Ajustes). */
    static String state(Context ctx) {
        if (Build.VERSION.SDK_INT < 25) return "unsupported";
        ShortcutManager sm = ctx.getSystemService(ShortcutManager.class);
        if (sm == null) return "unsupported";
        for (ShortcutInfo s : sm.getManifestShortcuts()) if (MANIFEST_ID.equals(s.getId())) return "manifest";
        for (ShortcutInfo s : sm.getDynamicShortcuts()) if (DYNAMIC_ID.equals(s.getId())) return "dynamic";
        return "none";
    }
}
