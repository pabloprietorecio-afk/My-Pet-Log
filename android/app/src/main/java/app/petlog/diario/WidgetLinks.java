package app.petlog.diario;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

/** Enlaces que abren PetLog desde el widget, el atajo y los ajustes rápidos. */
final class WidgetLinks {
    private WidgetLinks() { }

    static Intent view(Context ctx, String url) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        i.setClass(ctx, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return i;
    }

    static PendingIntent pending(Context ctx, int code, String url) {
        return PendingIntent.getActivity(ctx, code, view(ctx, url), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static String voice(String petId) {
        return petId == null || petId.isEmpty() ? "petlog://voz" : "petlog://voz?pet=" + Uri.encode(petId);
    }
}
