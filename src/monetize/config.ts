/**
 * Identificadores de AdMob y de la compra Premium.
 *
 * Mientras no estén los de la cuenta real se usan los identificadores de PRUEBA que publica Google
 * (https://developers.google.com/admob/android/test-ads): muestran anuncios de ejemplo y no generan ingresos.
 * El identificador de la app (~) está también en AndroidManifest.xml (com.google.android.gms.ads.APPLICATION_ID).
 */
export const ADMOB_TEST = true

export const ADMOB = {
  /** Banner adaptativo. */
  banner: ADMOB_TEST ? 'ca-app-pub-3940256099942544/9214589741' : 'ca-app-pub-REAL/BANNER',
}

/** Producto de compra única en Google Play Console (Productos integrados en la aplicación). */
export const PREMIUM_PRODUCT = 'petlog_premium'

/** Mascotas que se pueden tener sin Premium. */
export const FREE_PETS = 2
