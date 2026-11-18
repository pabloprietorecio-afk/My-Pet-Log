package app.petlog.diario;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.widget.RemoteViews;

/** Widget pequeño: un micrófono que abre PetLog escuchando. */
public class VoiceWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    static RemoteViews build(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_mic);
        v.setOnClickPendingIntent(R.id.widget_root, WidgetLinks.pending(ctx, 100, WidgetLinks.voice(WidgetStore.petId(ctx))));
        return v;
    }

    static void refresh(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, VoiceWidget.class));
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }
}
