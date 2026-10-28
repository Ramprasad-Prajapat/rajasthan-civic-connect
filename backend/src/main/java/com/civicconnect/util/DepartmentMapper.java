package com.civicconnect.util;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps complaint category keywords to the corresponding municipal department.
 * Directly ported from legacy Node departmentMapper.js.
 */
public final class DepartmentMapper {

    private static final Map<String, String> MAPPING = new LinkedHashMap<>();

    static {
        MAPPING.put("garbage", "Sanitation Department");
        MAPPING.put("sanitation", "Sanitation Department");
        MAPPING.put("water", "Water Department");
        MAPPING.put("street light", "Electrical Department");
        MAPPING.put("electricity", "Electrical Department");
        MAPPING.put("electrical", "Electrical Department");
        MAPPING.put("electric", "Electrical Department");
        MAPPING.put("road", "Public Works Department");
        MAPPING.put("pavement", "Public Works Department");
        MAPPING.put("drainage", "Sewerage Department");
        MAPPING.put("sewer", "Sewerage Department");
        MAPPING.put("animal", "Animal Control Department");
    }

    private DepartmentMapper() {}

    /**
     * Resolves department name based on category keyword match, or returns default.
     */
    public static String mapCategoryToDepartment(String category) {
        if (category == null || category.isBlank()) {
            return "General Municipal Department";
        }
        String lower = category.toLowerCase();
        for (Map.Entry<String, String> entry : MAPPING.entrySet()) {
            if (lower.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return "General Municipal Department";
    }
}
