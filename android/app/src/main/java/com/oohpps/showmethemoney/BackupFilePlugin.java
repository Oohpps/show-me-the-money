package com.oohpps.showmethemoney;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BackupFile")
public class BackupFilePlugin extends Plugin {
    @PluginMethod
    public void saveJson(PluginCall call) {
        String fileName = call.getString("fileName", "show-me-the-money-backup.json");
        String content = call.getString("content", "");

        try {
            Uri uri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    call.reject("Unable to create backup file.");
                    return;
                }

                try (OutputStream output = resolver.openOutputStream(uri)) {
                    if (output == null) {
                        call.reject("Unable to open backup file.");
                        return;
                    }
                    output.write(content.getBytes(StandardCharsets.UTF_8));
                }
            } else {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File backupFile = new File(downloadsDir, fileName);
                try (OutputStream output = new FileOutputStream(backupFile)) {
                    output.write(content.getBytes(StandardCharsets.UTF_8));
                }
                uri = Uri.fromFile(backupFile);
            }

            JSObject response = new JSObject();
            response.put("uri", uri.toString());
            call.resolve(response);
        } catch (Exception error) {
            call.reject("Unable to save backup file.", error);
        }
    }
}
