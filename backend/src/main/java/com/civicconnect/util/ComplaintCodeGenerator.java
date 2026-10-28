package com.civicconnect.util;

import java.time.Year;

/**
 * Generates unique complaint ticket codes matching legacy Node format:
 * prefix-district-ulb-year-serial (e.g. RJCIVIC-JAI-NNG-2026-0001).
 */
public final class ComplaintCodeGenerator {

    private ComplaintCodeGenerator() {}

    public static String generatePrefix(String district, String ulbName, boolean isEmergency) {
        String prefix = isEmergency ? "EMG" : "RJCIVIC";
        String dist = (district != null && !district.isBlank()) ? district.trim() : "JAI";
        String districtCode = dist.length() >= 3 ? dist.substring(0, 3).toUpperCase() : dist.toUpperCase();

        String ulbCode = "NNJ";
        if (ulbName != null && !ulbName.isBlank()) {
            String cleaned = ulbName.replaceAll("\\s+", "").toUpperCase();
            if (cleaned.contains("NIGAM")) {
                ulbCode = "NNG";
            } else if (cleaned.contains("PARISHAD")) {
                ulbCode = "NP";
            } else if (cleaned.contains("PALIKA")) {
                ulbCode = "NPL";
            } else if (cleaned.length() >= 3) {
                ulbCode = cleaned.substring(0, 3);
            }
        }

        int year = Year.now().getValue();
        return String.format("%s-%s-%s-%d", prefix, districtCode, ulbCode, year);
    }

    public static String formatCode(String prefixPart, long sequence) {
        return String.format("%s-%04d", prefixPart, sequence);
    }
}
