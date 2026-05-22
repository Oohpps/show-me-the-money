package com.oohpps.showmethemoney;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "BiometricAuth")
public class BiometricAuthPlugin extends Plugin {
    @PluginMethod
    public void authenticate(PluginCall call) {
        String title = call.getString("title", "Verify identity");
        String subtitle = call.getString("subtitle", "Use system biometric authentication to continue");
        String negativeButtonText = call.getString("negativeButtonText", "Cancel");

        int authenticators = BiometricManager.Authenticators.BIOMETRIC_WEAK;
        BiometricManager biometricManager = BiometricManager.from(getContext());
        int canAuthenticate = biometricManager.canAuthenticate(authenticators);
        if (canAuthenticate != BiometricManager.BIOMETRIC_SUCCESS) {
            call.reject("Biometric authentication is not available.");
            return;
        }

        Executor executor = ContextCompat.getMainExecutor(getContext());
        BiometricPrompt.AuthenticationCallback callback = new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                JSObject response = new JSObject();
                response.put("verified", true);
                call.resolve(response);
            }

            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                JSObject response = new JSObject();
                response.put("verified", false);
                response.put("errorCode", errorCode);
                response.put("message", errString.toString());
                call.resolve(response);
            }

            @Override
            public void onAuthenticationFailed() {
                notifyListeners("authenticationFailed", new JSObject());
            }
        };

        BiometricPrompt prompt = new BiometricPrompt(getActivity(), executor, callback);
        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setNegativeButtonText(negativeButtonText)
            .setAllowedAuthenticators(authenticators)
            .build();

        getActivity().runOnUiThread(() -> prompt.authenticate(promptInfo));
    }
}
