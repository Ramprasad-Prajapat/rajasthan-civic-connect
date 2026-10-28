package com.civicconnect.util;

import org.junit.jupiter.api.Test;

import java.time.Year;

import static org.junit.jupiter.api.Assertions.*;

class ComplaintCodeGeneratorTest {

    @Test
    void testStandardPrefixGeneration() {
        int year = Year.now().getValue();
        String prefix = ComplaintCodeGenerator.generatePrefix("Jaipur", "Nagar Nigam Jaipur", false);
        assertEquals("RJCIVIC-JAI-NNG-" + year, prefix);
    }

    @Test
    void testEmergencyPrefix() {
        int year = Year.now().getValue();
        String prefix = ComplaintCodeGenerator.generatePrefix("Jodhpur", "Municipal Board", true);
        assertEquals("EMG-JOD-MUN-" + year, prefix);
    }

    @Test
    void testCodeFormatting() {
        String code = ComplaintCodeGenerator.formatCode("RJCIVIC-JAI-NNG-2026", 42);
        assertEquals("RJCIVIC-JAI-NNG-2026-0042", code);
    }

    @Test
    void testParishadAndPalikaCodes() {
        int year = Year.now().getValue();
        String prefixParishad = ComplaintCodeGenerator.generatePrefix("Udaipur", "Nagar Parishad", false);
        assertEquals("RJCIVIC-UDA-NP-" + year, prefixParishad);

        String prefixPalika = ComplaintCodeGenerator.generatePrefix("Kota", "Nagar Palika", false);
        assertEquals("RJCIVIC-KOT-NPL-" + year, prefixPalika);
    }
}
