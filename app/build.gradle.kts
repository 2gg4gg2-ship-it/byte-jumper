plugins {
    id("com.android.application") version "8.5.2"
    id("org.jetbrains.kotlin.android") version "2.0.20"
}

android {
    namespace = "com.bytejumper.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.bytejumper.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 51
        versionName = "0.16.1"
    }
    // Постоянный debug-ключ: новые APK ставятся поверх старых
    signingConfigs {
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    jvmToolchain(17)
}
