package app.petlog.diario;

import android.annotation.SuppressLint;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/** Botón «Anotar por voz» del panel de ajustes rápidos. Con el móvil bloqueado, pide desbloquearlo antes. */
public class VoiceTileService extends TileService {
    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile t = getQsTile();
        if (t == null) return;
        t.setState(Tile.STATE_INACTIVE);
        t.setLabel(getString(R.string.voice_label));
        t.setIcon(Icon.createWithResource(this, R.drawable.ic_widget_mic));
        if (Build.VERSION.SDK_INT >= 29) t.setSubtitle(getString(R.string.app_name));
        t.updateTile();
    }

    @Override
    public void onClick() {
        super.onClick();
        if (isLocked()) unlockAndRun(this::open);
        else open();
    }

    @SuppressLint("StartActivityAndCollapseDeprecated")
    private void open() {
        String url = WidgetLinks.voice(WidgetStore.petId(this));
        if (Build.VERSION.SDK_INT >= 34) {
            // Android 14+: hay que pasar un PendingIntent.
            startActivityAndCollapse(WidgetLinks.pending(this, 400, url));
        } else {
            startActivityAndCollapse(WidgetLinks.view(this, url));
        }
    }
}
