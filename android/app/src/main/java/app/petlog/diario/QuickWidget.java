package app.petlog.diario;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Bitmap;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

/** Widget grande: micrófono + los tres primeros botones de la última mascota abierta. */
public class QuickWidget extends AppWidgetProvider {
    private static final int[] BOX = { R.id.b0, R.id.b1, R.id.b2 };
    private static final int[] IMG = { R.id.b0_img, R.id.b1_img, R.id.b2_img };
    private static final int[] TXT = { R.id.b0_txt, R.id.b1_txt, R.id.b2_txt };

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    static RemoteViews build(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_quick);
        String petId = WidgetStore.petId(ctx);
        String petName = WidgetStore.petName(ctx);
        v.setTextViewText(R.id.pet_name, petName == null || petName.isEmpty() ? ctx.getString(R.string.app_name) : petName);
        v.setOnClickPendingIntent(R.id.mic, WidgetLinks.pending(ctx, 200, WidgetLinks.voice(petId)));
        v.setOnClickPendingIntent(R.id.pet_name, WidgetLinks.pending(ctx, 201, WidgetLinks.voice(petId)));
        int shown = 0;
        for (int i = 0; i < 3; i++) {
            WidgetStore.Item it = WidgetStore.item(ctx, i);
            if (it == null || petId == null) {
                v.setViewVisibility(BOX[i], View.INVISIBLE);
                continue;
            }
            shown++;
            v.setViewVisibility(BOX[i], View.VISIBLE);
            v.setTextViewText(TXT[i], it.label);
            v.setContentDescription(BOX[i], ctx.getString(R.string.widget_log_item, it.label));
            Bitmap b = WidgetStore.bitmap(ctx, i);
            if (b != null) v.setImageViewBitmap(IMG[i], b);
            String url = "petlog://anotar/" + Uri.encode(it.typeId) + "?pet=" + Uri.encode(petId);
            v.setOnClickPendingIntent(BOX[i], WidgetLinks.pending(ctx, 300 + i, url));
        }
        v.setViewVisibility(R.id.empty, shown == 0 ? View.VISIBLE : View.GONE);
        return v;
    }

    static void refresh(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, QuickWidget.class));
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }
}
