package app.petlog.diario;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import java.io.File;
import java.io.FileOutputStream;

/**
 * Lo que muestran los widgets (mascota y tres botones con su ilustración). Lo escribe la app al abrir «Hoy»;
 * los registros siguen guardándose solo dentro de la app.
 */
final class WidgetStore {
    private WidgetStore() { }

    static final class Item {
        final String typeId;
        final String label;
        Item(String typeId, String label) { this.typeId = typeId; this.label = label; }
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences("petlog_widgets", Context.MODE_PRIVATE);
    }

    static String petId(Context ctx) { return prefs(ctx).getString("petId", null); }
    static String petName(Context ctx) { return prefs(ctx).getString("petName", null); }

    static Item item(Context ctx, int i) {
        SharedPreferences p = prefs(ctx);
        String id = p.getString("t" + i, null);
        if (id == null) return null;
        return new Item(id, p.getString("l" + i, ""));
    }

    private static File file(Context ctx, int i) {
        File dir = new File(ctx.getFilesDir(), "widget");
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, "b" + i + ".png");
    }

    static Bitmap bitmap(Context ctx, int i) {
        File f = file(ctx, i);
        return f.exists() ? BitmapFactory.decodeFile(f.getAbsolutePath()) : null;
    }

    static void save(Context ctx, String petId, String petName, String[] ids, String[] labels, String[] pngs) {
        SharedPreferences.Editor e = prefs(ctx).edit();
        e.putString("petId", petId);
        e.putString("petName", petName);
        for (int i = 0; i < 3; i++) {
            if (i < ids.length && ids[i] != null) {
                e.putString("t" + i, ids[i]);
                e.putString("l" + i, labels[i]);
                String data = pngs[i];
                if (data != null) {
                    int comma = data.indexOf(',');
                    byte[] bytes = Base64.decode(comma >= 0 ? data.substring(comma + 1) : data, Base64.DEFAULT);
                    try (FileOutputStream out = new FileOutputStream(file(ctx, i))) {
                        out.write(bytes);
                    } catch (Exception ignored) { }
                }
            } else {
                e.remove("t" + i);
                e.remove("l" + i);
                file(ctx, i).delete();
            }
        }
        e.apply();
    }
}
