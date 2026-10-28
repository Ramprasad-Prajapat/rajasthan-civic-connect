package com.civicconnect.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DepartmentMapperTest {

    @Test
    void testGarbageMapsToSanitation() {
        assertEquals("Sanitation Department", DepartmentMapper.mapCategoryToDepartment("Garbage in street"));
        assertEquals("Sanitation Department", DepartmentMapper.mapCategoryToDepartment("sanitation"));
    }

    @Test
    void testWaterMapsToWaterDepartment() {
        assertEquals("Water Department", DepartmentMapper.mapCategoryToDepartment("Water pipeline burst"));
    }

    @Test
    void testElectricityAndStreetLight() {
        assertEquals("Electrical Department", DepartmentMapper.mapCategoryToDepartment("street light broken"));
        assertEquals("Electrical Department", DepartmentMapper.mapCategoryToDepartment("electricity failure"));
    }

    @Test
    void testRoadsAndPavement() {
        assertEquals("Public Works Department", DepartmentMapper.mapCategoryToDepartment("road pothole"));
        assertEquals("Public Works Department", DepartmentMapper.mapCategoryToDepartment("broken pavement"));
    }

    @Test
    void testDrainageAndSewer() {
        assertEquals("Sewerage Department", DepartmentMapper.mapCategoryToDepartment("drainage blockage"));
        assertEquals("Sewerage Department", DepartmentMapper.mapCategoryToDepartment("open sewer"));
    }

    @Test
    void testAnimalControl() {
        assertEquals("Animal Control Department", DepartmentMapper.mapCategoryToDepartment("stray animal issue"));
    }

    @Test
    void testUnknownDefaultsToGeneralMunicipal() {
        assertEquals("General Municipal Department", DepartmentMapper.mapCategoryToDepartment("random issue"));
        assertEquals("General Municipal Department", DepartmentMapper.mapCategoryToDepartment(null));
        assertEquals("General Municipal Department", DepartmentMapper.mapCategoryToDepartment(""));
    }
}
