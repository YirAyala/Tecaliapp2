package com.tecaliapp;

import android.app.Application;

import com.RNFetchBlob.RNFetchBlobPackage;
import com.airbnb.android.react.maps.MapsPackage;
import com.facebook.react.ReactApplication;

import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.imagepicker.ImagePickerPackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.reactnativedocumentpicker.ReactNativeDocumentPicker;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.swmansion.reanimated.ReanimatedPackage;
import com.vonovak.AddCalendarEventPackage;
import io.invertase.firebase.RNFirebasePackage; // <-- react-native-firebase
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage; // <-- react-native-firebase
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import com.rt2zz.reactnativecontacts.ReactNativeContacts; 

import org.wonday.pdf.RCTPdfView;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
            new MainReactPackage(),
            new RNFirebasePackage(),
            new ReanimatedPackage(),
            new PickerPackage(),
            new AddCalendarEventPackage(),
            new RNGestureHandlerPackage(),
            new RNFetchBlobPackage(),
            new ReactNativeDocumentPicker(),
            new MapsPackage(),
            new AsyncStoragePackage(),
            new RCTPdfView(),
            new ImagePickerPackage(),
            new RNFirebaseMessagingPackage(),
            new RNFirebaseNotificationsPackage(),  // <-- react-native-firebase
            new ReactNativeContacts()
      );
    }

    @Override
    protected String getJSMainModuleName() {
        return "index";
      }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
      return mReactNativeHost;
    }

    // react-native-fcm
    @Override
    public void onCreate() { // <-- Check this block exists
      super.onCreate();
      SoLoader.init(this, /* native exopackage */ false); // <-- Check this line exists within the block
    }
}
