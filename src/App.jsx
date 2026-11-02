import React, { useEffect, useMemo, useState } from "react";
import { dataService } from './services/dataService.js';
import { useData, useQuery, useSearch } from './hooks/useData.js';

// ─────────────────────────────────────────────────────────────────────────────
// Weightlifting results + videos site with Supabase integration
// - Uses Tailwind for styling
// - Hash-based router (#/competitions, #/competitions/:id, #/athletes/:id, #/records)
// - Supports both Supabase and mockDB data sources
// - Lift viewer with embedded YouTube at timecodes
// ─────────────────────────────────────────────────────────────────────────────

// Mock Data (trimmed but structured like a real DB)
const mockDB = {
  federations: [
    { id: "iwf", name: "International Weightlifting Federation", region: "World", code: "IWF", level: "international" },
  ],
  weightClasses: [
    { id: "W45-2018", gender: "F", label: "45 kg", min_kg: 0, max_kg: 45, rule_era: "2018+" },
    { id: "W49-2018", gender: "F", label: "49 kg", min_kg: 45, max_kg: 49, rule_era: "2018+" },
    { id: "W55-2018", gender: "F", label: "55 kg", min_kg: 49, max_kg: 55, rule_era: "2018+" },
    { id: "W59-2018", gender: "F", label: "59 kg", min_kg: 55, max_kg: 59, rule_era: "2018+" },
    { id: "W64-2018", gender: "F", label: "64 kg", min_kg: 59, max_kg: 64, rule_era: "2018+" },
    { id: "M55-2018", gender: "M", label: "55 kg", min_kg: 0, max_kg: 55, rule_era: "2018+" },
    { id: "M61-2018", gender: "M", label: "61 kg", min_kg: 55, max_kg: 61, rule_era: "2018+" },
    { id: "M73-2018", gender: "M", label: "73 kg", min_kg: 69, max_kg: 73, rule_era: "2018+" },
    { id: "M81-2018", gender: "M", label: "81 kg", min_kg: 73, max_kg: 81, rule_era: "2018+" },
    { id: "W64-legacy", gender: "F", label: "64 kg", min_kg: 59, max_kg: 64, rule_era: "2018+" },
  ],
  competitions: [
    {
      id: "cmp_awc_2025",
      federation_id: "iwf",
      name: "2025 Asian Weightlifting Championships",
      city: "Jiangshan",
      country: "China",
      start_date: "2025-05-06",
      end_date: "2025-05-16",
      level: "continental",
      status: "finished",
      url_slug: "asian-championships-2025",
    },
    {
      id: "cmp_worlds_2024",
      federation_id: "iwf",
      name: "IWF World Championships 2024",
      city: "Doha",
      country: "Qatar",
      start_date: "2024-11-02",
      end_date: "2024-11-17",
      level: "international",
      status: "finished",
      url_slug: "iwf-worlds-2024",
    },
    {
      id: "cmp_continental_2025",
      federation_id: "iwf",
      name: "European Championships 2025",
      city: "Sofia",
      country: "Bulgaria",
      start_date: "2025-04-10",
      end_date: "2025-04-20",
      level: "international",
      status: "finished",
      url_slug: "euro-2025",
    },
  ],
  sessions: [
    // Asian Championships 2025 — sample sessions
    { id: "ses_awc25_w45A", competition_id: "cmp_awc_2025", date_time: "2025-05-09T09:00:00Z", gender: "F", weight_class_id: "W45-2018", group_label: "A", platform_label: "Platform 1", sort_order: 1 },
    { id: "ses_awc25_w49A", competition_id: "cmp_awc_2025", date_time: "2025-05-09T13:00:00Z", gender: "F", weight_class_id: "W49-2018", group_label: "A", platform_label: "Platform 1", sort_order: 2 },
    { id: "ses_awc25_m55A", competition_id: "cmp_awc_2025", date_time: "2025-05-09T17:00:00Z", gender: "M", weight_class_id: "M55-2018", group_label: "A", platform_label: "Platform 1", sort_order: 3 },
    { id: "ses_awc25_m61A", competition_id: "cmp_awc_2025", date_time: "2025-05-10T14:00:00Z", gender: "M", weight_class_id: "M61-2018", group_label: "A", platform_label: "Platform 1", sort_order: 4 },

    // existing demo sessions
    { id: "ses1", competition_id: "cmp_worlds_2024", date_time: "2024-11-05T18:00:00Z", gender: "M", weight_class_id: "M73-2018", group_label: "A", platform_label: "Platform 1", sort_order: 5 },
    { id: "ses2", competition_id: "cmp_worlds_2024", date_time: "2024-11-06T18:00:00Z", gender: "F", weight_class_id: "W64-legacy", group_label: "A", platform_label: "Platform 1", sort_order: 6 },
    { id: "ses3", competition_id: "cmp_continental_2025", date_time: "2025-04-15T16:00:00Z", gender: "M", weight_class_id: "M81-2018", group_label: "A", platform_label: "Platform 2", sort_order: 7 },
  ],
  athletes: [
    // From Asian Championships 2025 (subset)
    { id: "ath_zhao_jinhong", full_name: "ZHAO Jinhong", gender: "F", nationality: "CHN", dob: "2001-05-26" },
    { id: "ath_hong_ziyu", full_name: "HONG Zi Yu", gender: "F", nationality: "TPE", dob: "2002-07-13" },
    { id: "ath_pham_dinh_thi", full_name: "PHAM Dinh Thi", gender: "F", nationality: "VIE", dob: "2001-10-05" },
    { id: "ath_nguyen_thu_trang", full_name: "NGUYEN Thi Thu Trang", gender: "F", nationality: "VIE", dob: "2003-06-03" },
    { id: "ath_batnasan_tungalag", full_name: "BATNASAN Tungalag", gender: "F", nationality: "MGL", dob: "1999-07-07" },
    { id: "ath_bristy_mst", full_name: "BRISTY Mst", gender: "F", nationality: "BAN", dob: "2006-10-02" },

    { id: "ath_sukcharoen_thanyathon", full_name: "SUKCHAROEN Thanyathon", gender: "F", nationality: "THA", dob: "1997-04-21" },
    { id: "ath_ramos_rosegie", full_name: "RAMOS Rosegie", gender: "F", nationality: "PHI", dob: "2003-12-15" },
    { id: "ath_xiang_linx", full_name: "XIANG Linxiang", gender: "F", nationality: "CHN", dob: "2004-03-14" },
    { id: "ath_lin_cheng_jing", full_name: "LIN Cheng Jing", gender: "F", nationality: "TPE", dob: "2000-01-20" },
    { id: "ath_fang_wan_ling", full_name: "FANG Wan-Ling", gender: "F", nationality: "TPE", dob: "1999-12-01" },

    { id: "ath_wang_weidong", full_name: "WANG Weidong", gender: "M", nationality: "CHN", dob: "2004-02-11" },
    { id: "ath_lai_gia_thanh", full_name: "LAI Gia Thanh", gender: "M", nationality: "VIE", dob: "1998-05-03" },
    { id: "ath_al_saleem_mansour", full_name: "AL SALEEM Mansour", gender: "M", nationality: "KSA", dob: "1988-03-16" },
    { id: "ath_agad_fernando", full_name: "AGAD Fernando Jr", gender: "M", nationality: "PHI", dob: "2002-08-08" },
    { id: "ath_mohamad_rahimi", full_name: "MOHAMAD Rahimi Bin Sulaiman", gender: "M", nationality: "MAS", dob: "2003-02-04" },
    { id: "ath_tang_chun_yen", full_name: "TANG Chun-Yen", gender: "M", nationality: "TPE", dob: "2005-10-14" },

    { id: "ath_wang_hao", full_name: "WANG Hao", gender: "M", nationality: "CHN", dob: "1998-08-16" },
    { id: "ath_pak_myong_jin", full_name: "PAK Myong Jin", gender: "M", nationality: "PRK", dob: "2003-04-02" },
    { id: "ath_wang_min", full_name: "WANG Min", gender: "M", nationality: "CHN", dob: "2003-09-28" },
    { id: "ath_mohamad_aniq", full_name: "MOHAMAD ANIQ Bin Kasdan", gender: "M", nationality: "MAS", dob: "2002-06-16" },
    { id: "ath_aljasim_aqeel", full_name: "ALJASIM Aqeel", gender: "M", nationality: "KSA", dob: "2004-09-22" },
    { id: "ath_asyrani_syahmi", full_name: "ASYRANI Syahmi", gender: "M", nationality: "SGP", dob: "1999-11-12" },

    // existing demo athletes
    { id: "ath_001", full_name: "Li Fabin", gender: "M", nationality: "CHN", dob: "1993-01-15" },
    { id: "ath_002", full_name: "Karlos Nasar", gender: "M", nationality: "BUL", dob: "2004-05-04" },
    { id: "ath_003", full_name: "Sara Ahmed", gender: "F", nationality: "EGY", dob: "1998-01-01" },
  ],
  entries: [
    // W45 A
    { id: "ent_awc25_w45_zhj", session_id: "ses_awc25_w45A", athlete_id: "ath_zhao_jinhong", lot: 154, declared_sn: 88, declared_cj: 100 },
    { id: "ent_awc25_w45_hzy", session_id: "ses_awc25_w45A", athlete_id: "ath_hong_ziyu", lot: 146, declared_sn: 70, declared_cj: 88 },
    { id: "ent_awc25_w45_pdt", session_id: "ses_awc25_w45A", athlete_id: "ath_pham_dinh_thi", lot: 68, declared_sn: 68, declared_cj: 85 },
    { id: "ent_awc25_w45_ntt", session_id: "ses_awc25_w45A", athlete_id: "ath_nguyen_thu_trang", lot: 138, declared_sn: 65, declared_cj: 65 },
    { id: "ent_awc25_w45_btg", session_id: "ses_awc25_w45A", athlete_id: "ath_batnasan_tungalag", lot: 133, declared_sn: 62, declared_cj: 75 },
    { id: "ent_awc25_w45_bms", session_id: "ses_awc25_w45A", athlete_id: "ath_bristy_mst", lot: 36, declared_sn: 60, declared_cj: 77 },
    // W49 A
    { id: "ent_awc25_w49_stt", session_id: "ses_awc25_w49A", athlete_id: "ath_sukcharoen_thanyathon", lot: 4, declared_sn: 91, declared_cj: 109 },
    { id: "ent_awc25_w49_rrg", session_id: "ses_awc25_w49A", athlete_id: "ath_ramos_rosegie", lot: 137, declared_sn: 90, declared_cj: 107 },
    { id: "ent_awc25_w49_xlx", session_id: "ses_awc25_w49A", athlete_id: "ath_xiang_linx", lot: 88, declared_sn: 86, declared_cj: 103 },
    { id: "ent_awc25_w49_lcj", session_id: "ses_awc25_w49A", athlete_id: "ath_lin_cheng_jing", lot: 20, declared_sn: 85, declared_cj: 100 },
    { id: "ent_awc25_w49_fwl", session_id: "ses_awc25_w49A", athlete_id: "ath_fang_wan_ling", lot: 136, declared_sn: 75, declared_cj: 95 },
    // M55 A
    { id: "ent_awc25_m55_wwd", session_id: "ses_awc25_m55A", athlete_id: "ath_wang_weidong", lot: 62, declared_sn: 119, declared_cj: 146 },
    { id: "ent_awc25_m55_lgt", session_id: "ses_awc25_m55A", athlete_id: "ath_lai_gia_thanh", lot: 129, declared_sn: 120, declared_cj: 140 },
    { id: "ent_awc25_m55_msa", session_id: "ses_awc25_m55A", athlete_id: "ath_al_saleem_mansour", lot: 111, declared_sn: 117, declared_cj: 137 },
    { id: "ent_awc25_m55_afj", session_id: "ses_awc25_m55A", athlete_id: "ath_agad_fernando", lot: 49, declared_sn: 113, declared_cj: 141 },
    { id: "ent_awc25_m55_mrb", session_id: "ses_awc25_m55A", athlete_id: "ath_mohamad_rahimi", lot: 113, declared_sn: 106, declared_cj: 130 },
    { id: "ent_awc25_m55_tcy", session_id: "ses_awc25_m55A", athlete_id: "ath_tang_chun_yen", lot: 115, declared_sn: 90, declared_cj: 118 },
    // M61 A
    { id: "ent_awc25_m61_wh", session_id: "ses_awc25_m61A", athlete_id: "ath_wang_hao", lot: 132, declared_sn: 142, declared_cj: 163 },
    { id: "ent_awc25_m61_pmj", session_id: "ses_awc25_m61A", athlete_id: "ath_pak_myong_jin", lot: 45, declared_sn: 136, declared_cj: 170 },
    { id: "ent_awc25_m61_wm", session_id: "ses_awc25_m61A", athlete_id: "ath_wang_min", lot: 24, declared_sn: 134, declared_cj: 160 },
    { id: "ent_awc25_m61_mabk", session_id: "ses_awc25_m61A", athlete_id: "ath_mohamad_aniq", lot: 91, declared_sn: 132, declared_cj: 0 },
    { id: "ent_awc25_m61_aa", session_id: "ses_awc25_m61A", athlete_id: "ath_aljasim_aqeel", lot: 170, declared_sn: 121, declared_cj: 121 },
    { id: "ent_awc25_m61_as", session_id: "ses_awc25_m61A", athlete_id: "ath_asyrani_syahmi", lot: 65, declared_sn: 93, declared_cj: 90 },

    // existing demo entries
    { id: "ent_001", session_id: "ses1", athlete_id: "ath_001", lot: 8, declared_sn: 140, declared_cj: 170 },
    { id: "ent_002", session_id: "ses1", athlete_id: "ath_002", lot: 3, declared_sn: 158, declared_cj: 196 },
    { id: "ent_003", session_id: "ses2", athlete_id: "ath_003", lot: 6, declared_sn: 115, declared_cj: 146 },
    { id: "ent_004", session_id: "ses3", athlete_id: "ath_002", lot: 2, declared_sn: 165, declared_cj: 205 },
  ],
  attempts: [
    // For this import, we add the SUCCESSFUL attempts only (per result books). Additional miss data can be added later.
    // W45 A bests
    { id: "att_awc25_w45_zhj_sn3", entry_id: "ent_awc25_w45_zhj", lift_type: "SN", attempt_no: 3, weight_kg: 90, result: "OK", timestamp: "2025-05-09T09:20:00Z", video_id: undefined },
    { id: "att_awc25_w45_zhj_cj3", entry_id: "ent_awc25_w45_zhj", lift_type: "CJ", attempt_no: 3, weight_kg: 100, result: "OK", timestamp: "2025-05-09T09:45:00Z", video_id: undefined },

    { id: "att_awc25_w45_hzy_sn3", entry_id: "ent_awc25_w45_hzy", lift_type: "SN", attempt_no: 3, weight_kg: 73, result: "OK", timestamp: "2025-05-09T09:10:00Z", video_id: undefined },
    { id: "att_awc25_w45_hzy_cj3", entry_id: "ent_awc25_w45_hzy", lift_type: "CJ", attempt_no: 3, weight_kg: 88, result: "OK", timestamp: "2025-05-09T09:40:00Z", video_id: undefined },

    { id: "att_awc25_w45_pdt_sn3", entry_id: "ent_awc25_w45_pdt", lift_type: "SN", attempt_no: 3, weight_kg: 68, result: "OK", timestamp: "2025-05-09T09:05:00Z", video_id: undefined },
    { id: "att_awc25_w45_pdt_cj3", entry_id: "ent_awc25_w45_pdt", lift_type: "CJ", attempt_no: 3, weight_kg: 85, result: "OK", timestamp: "2025-05-09T09:35:00Z", video_id: undefined },

    { id: "att_awc25_w45_ntt_sn3", entry_id: "ent_awc25_w45_ntt", lift_type: "SN", attempt_no: 3, weight_kg: 65, result: "OK", timestamp: "2025-05-09T09:00:00Z", video_id: undefined },
    { id: "att_awc25_w45_ntt_cj3", entry_id: "ent_awc25_w45_ntt", lift_type: "CJ", attempt_no: 3, weight_kg: 65, result: "OK", timestamp: "2025-05-09T09:30:00Z", video_id: undefined },

    { id: "att_awc25_w45_btg_sn3", entry_id: "ent_awc25_w45_btg", lift_type: "SN", attempt_no: 3, weight_kg: 62, result: "OK", timestamp: "2025-05-09T08:55:00Z", video_id: undefined },
    { id: "att_awc25_w45_btg_cj3", entry_id: "ent_awc25_w45_btg", lift_type: "CJ", attempt_no: 3, weight_kg: 75, result: "OK", timestamp: "2025-05-09T09:25:00Z", video_id: undefined },

    { id: "att_awc25_w45_bms_sn3", entry_id: "ent_awc25_w45_bms", lift_type: "SN", attempt_no: 3, weight_kg: 60, result: "OK", timestamp: "2025-05-09T08:50:00Z", video_id: undefined },
    { id: "att_awc25_w45_bms_cj3", entry_id: "ent_awc25_w45_bms", lift_type: "CJ", attempt_no: 3, weight_kg: 77, result: "OK", timestamp: "2025-05-09T09:20:00Z", video_id: undefined },

    // W49 A bests
    { id: "att_awc25_w49_stt_sn3", entry_id: "ent_awc25_w49_stt", lift_type: "SN", attempt_no: 3, weight_kg: 91, result: "OK", timestamp: "2025-05-09T13:20:00Z" },
    { id: "att_awc25_w49_stt_cj3", entry_id: "ent_awc25_w49_stt", lift_type: "CJ", attempt_no: 3, weight_kg: 109, result: "OK", timestamp: "2025-05-09T13:45:00Z" },

    { id: "att_awc25_w49_rrg_sn3", entry_id: "ent_awc25_w49_rrg", lift_type: "SN", attempt_no: 3, weight_kg: 90, result: "OK", timestamp: "2025-05-09T13:10:00Z" },
    { id: "att_awc25_w49_rrg_cj3", entry_id: "ent_awc25_w49_rrg", lift_type: "CJ", attempt_no: 3, weight_kg: 107, result: "OK", timestamp: "2025-05-09T13:40:00Z" },

    { id: "att_awc25_w49_xlx_sn3", entry_id: "ent_awc25_w49_xlx", lift_type: "SN", attempt_no: 3, weight_kg: 86, result: "OK", timestamp: "2025-05-09T13:05:00Z" },
    { id: "att_awc25_w49_xlx_cj3", entry_id: "ent_awc25_w49_xlx", lift_type: "CJ", attempt_no: 3, weight_kg: 103, result: "OK", timestamp: "2025-05-09T13:35:00Z" },

    { id: "att_awc25_w49_lcj_sn3", entry_id: "ent_awc25_w49_lcj", lift_type: "SN", attempt_no: 3, weight_kg: 85, result: "OK", timestamp: "2025-05-09T13:00:00Z" },
    { id: "att_awc25_w49_lcj_cj3", entry_id: "ent_awc25_w49_lcj", lift_type: "CJ", attempt_no: 3, weight_kg: 100, result: "OK", timestamp: "2025-05-09T13:30:00Z" },

    { id: "att_awc25_w49_fwl_sn3", entry_id: "ent_awc25_w49_fwl", lift_type: "SN", attempt_no: 3, weight_kg: 75, result: "OK", timestamp: "2025-05-09T12:55:00Z" },
    { id: "att_awc25_w49_fwl_cj3", entry_id: "ent_awc25_w49_fwl", lift_type: "CJ", attempt_no: 3, weight_kg: 95, result: "OK", timestamp: "2025-05-09T13:25:00Z" },

    // M55 A bests
    { id: "att_awc25_m55_wwd_sn3", entry_id: "ent_awc25_m55_wwd", lift_type: "SN", attempt_no: 3, weight_kg: 119, result: "OK", timestamp: "2025-05-09T17:15:00Z" },
    { id: "att_awc25_m55_wwd_cj3", entry_id: "ent_awc25_m55_wwd", lift_type: "CJ", attempt_no: 3, weight_kg: 146, result: "OK", timestamp: "2025-05-09T17:45:00Z" },

    { id: "att_awc25_m55_lgt_sn3", entry_id: "ent_awc25_m55_lgt", lift_type: "SN", attempt_no: 3, weight_kg: 120, result: "OK", timestamp: "2025-05-09T17:20:00Z" },
    { id: "att_awc25_m55_lgt_cj3", entry_id: "ent_awc25_m55_lgt", lift_type: "CJ", attempt_no: 3, weight_kg: 140, result: "OK", timestamp: "2025-05-09T17:50:00Z" },

    { id: "att_awc25_m55_msa_sn3", entry_id: "ent_awc25_m55_msa", lift_type: "SN", attempt_no: 3, weight_kg: 117, result: "OK", timestamp: "2025-05-09T17:10:00Z" },
    { id: "att_awc25_m55_msa_cj3", entry_id: "ent_awc25_m55_msa", lift_type: "CJ", attempt_no: 3, weight_kg: 137, result: "OK", timestamp: "2025-05-09T17:40:00Z" },

    { id: "att_awc25_m55_afj_sn3", entry_id: "ent_awc25_m55_afj", lift_type: "SN", attempt_no: 3, weight_kg: 113, result: "OK", timestamp: "2025-05-09T17:08:00Z" },
    { id: "att_awc25_m55_afj_cj3", entry_id: "ent_awc25_m55_afj", lift_type: "CJ", attempt_no: 3, weight_kg: 141, result: "OK", timestamp: "2025-05-09T17:38:00Z" },

    { id: "att_awc25_m55_mrb_sn3", entry_id: "ent_awc25_m55_mrb", lift_type: "SN", attempt_no: 3, weight_kg: 106, result: "OK", timestamp: "2025-05-09T17:05:00Z" },
    { id: "att_awc25_m55_mrb_cj3", entry_id: "ent_awc25_m55_mrb", lift_type: "CJ", attempt_no: 3, weight_kg: 130, result: "OK", timestamp: "2025-05-09T17:35:00Z" },

    { id: "att_awc25_m55_tcy_sn3", entry_id: "ent_awc25_m55_tcy", lift_type: "SN", attempt_no: 3, weight_kg: 90, result: "OK", timestamp: "2025-05-09T17:00:00Z" },
    { id: "att_awc25_m55_tcy_cj3", entry_id: "ent_awc25_m55_tcy", lift_type: "CJ", attempt_no: 3, weight_kg: 118, result: "OK", timestamp: "2025-05-09T17:30:00Z" },

    // M61 A bests
    { id: "att_awc25_m61_wh_sn3", entry_id: "ent_awc25_m61_wh", lift_type: "SN", attempt_no: 3, weight_kg: 142, result: "OK", timestamp: "2025-05-10T14:10:00Z" },
    { id: "att_awc25_m61_wh_cj3", entry_id: "ent_awc25_m61_wh", lift_type: "CJ", attempt_no: 3, weight_kg: 163, result: "OK", timestamp: "2025-05-10T14:40:00Z" },

    { id: "att_awc25_m61_pmj_sn3", entry_id: "ent_awc25_m61_pmj", lift_type: "SN", attempt_no: 3, weight_kg: 136, result: "OK", timestamp: "2025-05-10T14:08:00Z" },
    { id: "att_awc25_m61_pmj_cj3", entry_id: "ent_awc25_m61_pmj", lift_type: "CJ", attempt_no: 3, weight_kg: 170, result: "OK", timestamp: "2025-05-10T14:38:00Z" },

    { id: "att_awc25_m61_wm_sn3", entry_id: "ent_awc25_m61_wm", lift_type: "SN", attempt_no: 3, weight_kg: 134, result: "OK", timestamp: "2025-05-10T14:06:00Z" },
    { id: "att_awc25_m61_wm_cj3", entry_id: "ent_awc25_m61_wm", lift_type: "CJ", attempt_no: 3, weight_kg: 160, result: "OK", timestamp: "2025-05-10T14:36:00Z" },

    { id: "att_awc25_m61_mabk_sn3", entry_id: "ent_awc25_m61_mabk", lift_type: "SN", attempt_no: 3, weight_kg: 132, result: "OK", timestamp: "2025-05-10T14:04:00Z" },

    { id: "att_awc25_m61_aa_sn3", entry_id: "ent_awc25_m61_aa", lift_type: "SN", attempt_no: 3, weight_kg: 121, result: "OK", timestamp: "2025-05-10T14:02:00Z" },
    { id: "att_awc25_m61_aa_cj3", entry_id: "ent_awc25_m61_aa", lift_type: "CJ", attempt_no: 3, weight_kg: 121, result: "OK", timestamp: "2025-05-10T14:32:00Z" },

    { id: "att_awc25_m61_as_sn3", entry_id: "ent_awc25_m61_as", lift_type: "SN", attempt_no: 3, weight_kg: 93, result: "OK", timestamp: "2025-05-10T14:00:00Z" },
    { id: "att_awc25_m61_as_cj3", entry_id: "ent_awc25_m61_as", lift_type: "CJ", attempt_no: 3, weight_kg: 90, result: "OK", timestamp: "2025-05-10T14:30:00Z" },

    // existing demo attempts
    { id: "att_1001", entry_id: "ent_002", lift_type: "SN", attempt_no: 1, weight_kg: 156, result: "OK", timestamp: "2024-11-05T18:22:31Z", video_id: "vid_nasar_156sn" },
    { id: "att_1002", entry_id: "ent_002", lift_type: "SN", attempt_no: 2, weight_kg: 161, result: "OK", timestamp: "2024-11-05T18:44:31Z", video_id: "vid_nasar_161sn" },
    { id: "att_1003", entry_id: "ent_002", lift_type: "SN", attempt_no: 3, weight_kg: 168, result: "XX", timestamp: "2024-11-05T18:51:31Z", video_id: "vid_nasar_168sn" },
    { id: "att_1004", entry_id: "ent_002", lift_type: "CJ", attempt_no: 1, weight_kg: 191, result: "OK", timestamp: "2024-11-05T19:12:31Z", video_id: "vid_nasar_191cj" },
    { id: "att_1005", entry_id: "ent_002", lift_type: "CJ", attempt_no: 2, weight_kg: 196, result: "OK", timestamp: "2024-11-05T19:26:31Z", video_id: "vid_nasar_196cj" },
    { id: "att_1006", entry_id: "ent_002", lift_type: "CJ", attempt_no: 3, weight_kg: 201, result: "XX", timestamp: "2024-11-05T19:39:31Z", video_id: "vid_nasar_201cj" },

    { id: "att_2001", entry_id: "ent_003", lift_type: "SN", attempt_no: 1, weight_kg: 110, result: "OK", timestamp: "2024-11-06T18:11:00Z", video_id: "vid_sara_110sn" },
    { id: "att_2002", entry_id: "ent_003", lift_type: "SN", attempt_no: 2, weight_kg: 114, result: "OK", timestamp: "2024-11-06T18:21:00Z", video_id: "vid_sara_114sn" },
    { id: "att_2003", entry_id: "ent_003", lift_type: "SN", attempt_no: 3, weight_kg: 116, result: "XX", timestamp: "2024-11-06T18:29:00Z", video_id: "vid_sara_116sn" },
    { id: "att_2004", entry_id: "ent_003", lift_type: "CJ", attempt_no: 1, weight_kg: 140, result: "OK", timestamp: "2024-11-06T18:40:00Z", video_id: "vid_sara_140cj" },
    { id: "att_2005", entry_id: "ent_003", lift_type: "CJ", attempt_no: 2, weight_kg: 146, result: "OK", timestamp: "2024-11-06T18:55:00Z", video_id: "vid_sara_146cj" },
    { id: "att_2006", entry_id: "ent_003", lift_type: "CJ", attempt_no: 3, weight_kg: 150, result: "XX", timestamp: "2024-11-06T19:07:00Z", video_id: "vid_sara_150cj" },

    { id: "att_3001", entry_id: "ent_001", lift_type: "SN", attempt_no: 1, weight_kg: 140, result: "OK", timestamp: "2024-11-05T18:10:00Z", video_id: "vid_li_140sn" },
    { id: "att_3002", entry_id: "ent_001", lift_type: "SN", attempt_no: 2, weight_kg: 145, result: "OK", timestamp: "2024-11-05T18:22:00Z", video_id: "vid_li_145sn" },
    { id: "att_3003", entry_id: "ent_001", lift_type: "SN", attempt_no: 3, weight_kg: 148, result: "XX", timestamp: "2024-11-05T18:32:00Z", video_id: "vid_li_148sn" },
    { id: "att_3004", entry_id: "ent_001", lift_type: "CJ", attempt_no: 1, weight_kg: 168, result: "OK", timestamp: "2024-11-05T18:50:00Z", video_id: "vid_li_168cj" },
    { id: "att_3005", entry_id: "ent_001", lift_type: "CJ", attempt_no: 2, weight_kg: 173, result: "OK", timestamp: "2024-11-05T19:05:00Z", video_id: "vid_li_173cj" },
    { id: "att_3006", entry_id: "ent_001", lift_type: "CJ", attempt_no: 3, weight_kg: 176, result: "XX", timestamp: "2024-11-05T19:20:00Z", video_id: "vid_li_176cj" },
  ],
  results: [
    // Asian Championships 2025 — results
    // W45 A totals
    { id: "res_awc25_w45_1", entry_id: "ent_awc25_w45_zhj", best_sn: 90, best_cj: 100, total: 190, placing: 1, bodyweight_kg: 44.9, points: undefined },
    { id: "res_awc25_w45_2", entry_id: "ent_awc25_w45_hzy", best_sn: 73, best_cj: 88, total: 161, placing: 2, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_w45_3", entry_id: "ent_awc25_w45_pdt", best_sn: 68, best_cj: 85, total: 153, placing: 3, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_w45_4", entry_id: "ent_awc25_w45_btg", best_sn: 62, best_cj: 75, total: 137, placing: 4, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_w45_5", entry_id: "ent_awc25_w45_bms", best_sn: 60, best_cj: 77, total: 137, placing: 5, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_w45_6", entry_id: "ent_awc25_w45_ntt", best_sn: 65, best_cj: 65, total: 130, placing: 6, bodyweight_kg: undefined, points: undefined },

    // W49 A totals
    { id: "res_awc25_w49_1", entry_id: "ent_awc25_w49_stt", best_sn: 91, best_cj: 109, total: 200, placing: 1, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_w49_2", entry_id: "ent_awc25_w49_rrg", best_sn: 90, best_cj: 107, total: 197, placing: 2, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_w49_3", entry_id: "ent_awc25_w49_xlx", best_sn: 86, best_cj: 103, total: 189, placing: 3, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_w49_4", entry_id: "ent_awc25_w49_lcj", best_sn: 85, best_cj: 100, total: 185, placing: 4, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_w49_5", entry_id: "ent_awc25_w49_fwl", best_sn: 75, best_cj: 95, total: 170, placing: 5, bodyweight_kg: undefined, points: undefined },

    // M55 A totals
    { id: "res_awc25_m55_1", entry_id: "ent_awc25_m55_wwd", best_sn: 119, best_cj: 146, total: 265, placing: 1, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m55_2", entry_id: "ent_awc25_m55_lgt", best_sn: 120, best_cj: 140, total: 260, placing: 2, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m55_3", entry_id: "ent_awc25_m55_msa", best_sn: 117, best_cj: 137, total: 254, placing: 3, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m55_4", entry_id: "ent_awc25_m55_afj", best_sn: 113, best_cj: 141, total: 254, placing: 4, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m55_5", entry_id: "ent_awc25_m55_mrb", best_sn: 106, best_cj: 130, total: 236, placing: 5, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m55_6", entry_id: "ent_awc25_m55_tcy", best_sn: 90, best_cj: 118, total: 208, placing: 6, bodyweight_kg: undefined, points: undefined },

    // M61 A totals
    { id: "res_awc25_m61_1", entry_id: "ent_awc25_m61_pmj", best_sn: 136, best_cj: 170, total: 306, placing: 1, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m61_2", entry_id: "ent_awc25_m61_wh", best_sn: 142, best_cj: 163, total: 305, placing: 2, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m61_3", entry_id: "ent_awc25_m61_wm", best_sn: 134, best_cj: 160, total: 294, placing: 3, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m61_4", entry_id: "ent_awc25_m61_mabk", best_sn: 132, best_cj: 0, total: undefined, placing: undefined, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m61_5", entry_id: "ent_awc25_m61_aa", best_sn: 121, best_cj: 121, total: 242, placing: 5, bodyweight_kg: undefined, points: undefined },
    { id: "res_awc25_m61_6", entry_id: "ent_awc25_m61_as", best_sn: 93, best_cj: 90, total: 183, placing: 6, bodyweight_kg: undefined, points: undefined },

    // existing demo results
    { id: "res_ent_002", entry_id: "ent_002", best_sn: 161, best_cj: 196, total: 357, placing: 1, bodyweight_kg: 80.8, points: 200.3 },
    { id: "res_ent_001", entry_id: "ent_001", best_sn: 145, best_cj: 173, total: 318, placing: 3, bodyweight_kg: 72.9, points: 184.1 },
    { id: "res_ent_003", entry_id: "ent_003", best_sn: 114, best_cj: 146, total: 260, placing: 1, bodyweight_kg: 63.8, points: 178.6 },
    { id: "res_ent_004", entry_id: "ent_004", best_sn: 165, best_cj: 205, total: 370, placing: 1, bodyweight_kg: 80.9, points: 205.7 },
  ],
  videos: [
    // Placeholder video entries remain from demo; add real IDs later
    { id: "vid_nasar_156sn", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 121000, end_ms: 123500 },
    { id: "vid_nasar_161sn", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 184500, end_ms: 186800 },
    { id: "vid_nasar_168sn", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 232000, end_ms: 234500 },
    { id: "vid_nasar_191cj", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 301000, end_ms: 303800 },
    { id: "vid_nasar_196cj", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 342000, end_ms: 344800 },
    { id: "vid_nasar_201cj", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 388000, end_ms: 390600 },

    { id: "vid_sara_110sn", source: "YOUTUBE", external_id: "a1b2c3", start_ms: 54000, end_ms: 56500 },
    { id: "vid_sara_114sn", source: "YOUTUBE", external_id: "a1b2c3", start_ms: 78000, end_ms: 80500 },
    { id: "vid_sara_116sn", source: "YOUTUBE", external_id: "a1b2c3", start_ms: 91000, end_ms: 94000 },
    { id: "vid_sara_140cj", source: "YOUTUBE", external_id: "a1b2c3", start_ms: 121000, end_ms: 124000 },
    { id: "vid_sara_146cj", source: "YOUTUBE", external_id: "a1b2c3", start_ms: 141000, end_ms: 144000 },
    { id: "vid_sara_150cj", source: "YOUTUBE", external_id: "a1b2c3", start_ms: 151000, end_ms: 154000 },

    { id: "vid_li_140sn", source: "YOUTUBE", external_id: "q1w2e3", start_ms: 22000, end_ms: 45000 },
    { id: "vid_li_145sn", source: "YOUTUBE", external_id: "q1w2e3", start_ms: 72000, end_ms: 96000 },
    { id: "vid_li_148sn", source: "YOUTUBE", external_id: "q1w2e3", start_ms: 101000, end_ms: 104000 },
    { id: "vid_li_168cj", source: "YOUTUBE", external_id: "q1w2e3", start_ms: 142000, end_ms: 145000 },
    { id: "vid_li_173cj", source: "YOUTUBE", external_id: "q1w2e3", start_ms: 161000, end_ms: 164000 },
    { id: "vid_li_176cj", source: "YOUTUBE", external_id: "q1w2e3", start_ms: 171000, end_ms: 174000 },
  ],
  records: [
    // example record retained
    { id: "rec1", federation_id: "iwf", weight_class_id: "M81-2018", gender: "M", record_type: "TOTAL", weight_kg: 396, holder_athlete_id: "ath_002", set_date: "2025-04-15", competition_id: "cmp_continental_2025" },
  ],
};

// Helper functions (now using dataService)
const byId = (arr, id) => arr.find((x) => x.id === id);
const entriesBySession = (sessionId, data) => data.entries.filter((e) => e.session_id === sessionId);
const attemptsByEntry = (entryId, data) => data.attempts.filter((a) => a.entry_id === entryId).sort((a, b) => (a.lift_type + a.attempt_no).localeCompare(b.lift_type + b.attempt_no));
const resultByEntry = (entryId, data) => data.results.find((r) => r.entry_id === entryId);
const videoById = (id, data) => data.videos.find((v) => v.id === id);
const sessionsByCompetition = (cmpId, data) => data.sessions.filter((s) => s.competition_id === cmpId).sort((a,b)=>a.sort_order-b.sort_order);

// Simple hash router
const useHashRoute = () => {
  const [hash, setHash] = useState(window.location.hash || "#/home");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash.replace(/^#/, "");
};

// Formatters
const fmtDate = (s) => new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const kg = (n) => `${n}\u00a0kg`;

// UI bits
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-neutral-800/60 ${className}`}>{children}</span>
);

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-sm ${className}`}>{children}</div>
);

const Section = ({ title, children, actions }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div>{actions}</div>
    </div>
    {children}
  </section>
);

// Nav + Layout
const Nav = ({ data }) => {
  const links = [
    { href: "#/home", label: "Home" },
    { href: "#/competitions", label: "Competitions" },
    { href: "#/athletes", label: "Athletes" },
    { href: "#/records", label: "Records" },
  ];
  return (
    <nav className="sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-neutral-800">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
        <a href="#/home" className="text-lg font-bold">GoodLift<span className="text-neutral-400">.io</span></a>
        <div className="flex items-center gap-4">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm hover:text-white text-neutral-300">{l.label}</a>
          ))}
        </div>
        <div className="ml-auto">
          <SearchBar data={data} />
        </div>
      </div>
    </nav>
  );
};

const SearchBar = ({ data }) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    if (!q.trim() || !data) return [];
    const term = q.toLowerCase();
    const athletes = data.athletes.filter((a) => a.full_name.toLowerCase().includes(term)).map((a) => ({ type: "athlete", id: a.id, label: a.full_name }));
    const comps = data.competitions.filter((c) => c.name.toLowerCase().includes(term)).map((c) => ({ type: "competition", id: c.id, label: c.name }));
    return [...athletes, ...comps].slice(0, 6);
  }, [q, data]);
  return (
    <div className="relative">
      <input
        className="w-72 rounded-xl bg-neutral-900/70 border border-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-700"
        placeholder="Search athletes or competitions…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div className="absolute mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
          {results.map((r) => (
            <a
              key={`${r.type}-${r.id}`}
              href={r.type === "athlete" ? `#/athletes/${r.id}` : `#/competitions/${r.id}`}
              className="block px-3 py-2 text-sm hover:bg-neutral-800/50"
            >{r.label}</a>
          ))}
        </div>
      )}
    </div>
  );
};

// Pages
const Home = ({ data }) => {
  if (!data) return <div className="p-6">Loading...</div>;
  
  const upcoming = data.competitions
    .map((c) => ({ ...c, start: new Date(c.start_date) }))
    .sort((a, b) => a.start - b.start)
    .slice(0, 4);
  const recentRecords = data.records.slice(0, 4);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">International Weightlifting — Results & Lifts</h1>
          <p className="text-neutral-400">Browse competitions, athletes, and watch every attempt with precise timecodes.</p>
        </div>
      </header>

      <Section title="Featured Competitions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcoming.map((c) => (
            <a key={c.id} href={`#/competitions/${c.id}`}>
              <Card className="p-4 hover:border-neutral-700 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-medium">{c.name}</div>
                    <div className="text-sm text-neutral-400">{c.city}, {c.country} • {fmtDate(c.start_date)} – {fmtDate(c.end_date)}</div>
                  </div>
                  <Badge>{c.level}</Badge>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </Section>

      <Section title="Recent Records">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentRecords.map((r) => {
            const wc = byId(data.weightClasses, r.weight_class_id);
            const ath = byId(data.athletes, r.holder_athlete_id);
            const cmp = byId(data.competitions, r.competition_id);
            return (
              <Card key={r.id} className="p-4">
                <div className="text-sm text-neutral-400">{byId(data.federations, r.federation_id)?.code} • {wc?.label} • {r.record_type}</div>
                <div className="text-2xl font-semibold mt-1">{kg(r.weight_kg)}</div>
                <div className="mt-1"><a href={`#/athletes/${ath.id}`} className="hover:underline">{ath.full_name}</a></div>
                <div className="text-sm text-neutral-400">Set {fmtDate(r.set_date)} at <a className="hover:underline" href={`#/competitions/${cmp.id}`}>{cmp.name}</a></div>
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

const CompetitionsIndex = ({ data }) => {
  const [q, setQ] = useState("");
  const comps = useMemo(() => {
    if (!data) return [];
    const term = q.toLowerCase();
    return data.competitions
      .filter((c) => c.name.toLowerCase().includes(term) || c.city.toLowerCase().includes(term) || c.country.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  }, [q, data]);
  
  if (!data) return <div className="p-6">Loading...</div>;
  
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Competitions</h1>
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Filter by name or location…" className="ml-auto w-72 rounded-xl bg-neutral-900/70 border border-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-700" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comps.map((c) => (
          <a key={c.id} href={`#/competitions/${c.id}`}>
            <Card className="p-4 hover:border-neutral-700 transition">
              <div className="text-lg font-medium">{c.name}</div>
              <div className="text-sm text-neutral-400">{c.city}, {c.country} • {fmtDate(c.start_date)} – {fmtDate(c.end_date)}</div>
              <div className="mt-2"><Badge>{c.level}</Badge> <Badge className="ml-2">{c.status}</Badge></div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
};

const CompetitionPage = ({ id, openLift, data }) => {
  if (!data) return <div className="p-6">Loading...</div>;
  
  const cmp = byId(data.competitions, id);
  const sessions = sessionsByCompetition(id, data);
  if (!cmp) return <div className="p-6">Competition not found.</div>;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{cmp.name}</h1>
          <div className="text-neutral-400">{cmp.city}, {cmp.country} • {fmtDate(cmp.start_date)} – {fmtDate(cmp.end_date)} • {cmp.level}</div>
        </div>
        <Badge>{cmp.status}</Badge>
      </div>

      <Section title="Sessions">
        <div className="space-y-4">
          {sessions.map((s) => {
            const wc = byId(data.weightClasses, s.weight_class_id);
            const entries = entriesBySession(s.id, data);
            return (
              <Card key={s.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.gender === "M" ? "Men" : "Women"} {wc?.label} • Group {s.group_label}</div>
                  <div className="text-sm text-neutral-400">{new Date(s.date_time).toLocaleString()}</div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-neutral-400">
                      <tr>
                        <th className="text-left py-2">Athlete</th>
                        <th className="text-left">Nation</th>
                        <th className="text-right">Snatch</th>
                        <th className="text-right">C&J</th>
                        <th className="text-right">Total</th>
                        <th className="text-right">Place</th>
                        <th className="text-right">Lifts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => {
                        const a = byId(data.athletes, e.athlete_id);
                        const r = resultByEntry(e.id, data);
                        const attempts = attemptsByEntry(e.id, data);
                        const best = { SN: Math.max(...attempts.filter(x=>x.lift_type==="SN" && x.result==="OK").map(x=>x.weight_kg), 0), CJ: Math.max(...attempts.filter(x=>x.lift_type==="CJ" && x.result==="OK").map(x=>x.weight_kg), 0) };
                        return (
                          <tr key={e.id} className="border-t border-neutral-800">
                            <td className="py-2"><a className="hover:underline" href={`#/athletes/${a.id}`}>{a.full_name}</a></td>
                            <td>{a.nationality}</td>
                            <td className="text-right">{best.SN ? kg(best.SN) : "—"}</td>
                            <td className="text-right">{best.CJ ? kg(best.CJ) : "—"}</td>
                            <td className="text-right">{r?.total ? kg(r.total) : "—"}</td>
                            <td className="text-right">{r?.placing ?? ""}</td>
                            <td className="text-right">
                              <button onClick={() => openLift(e.id)} className="text-xs rounded-lg px-3 py-1 border border-neutral-700 hover:bg-neutral-800/60">View</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

const AthletePage = ({ id, openLift, data }) => {
  if (!data) return <div className="p-6">Loading...</div>;
  
  const a = byId(data.athletes, id);
  if (!a) return <div className="p-6">Athlete not found.</div>;
  const athleteEntries = data.entries.filter((e) => e.athlete_id === id);
  const athleteAttempts = data.attempts.filter((t) => athleteEntries.some((e) => e.id === t.entry_id));
  const prSN = Math.max(...athleteAttempts.filter((x) => x.lift_type === "SN" && x.result === "OK").map((x) => x.weight_kg), 0);
  const prCJ = Math.max(...athleteAttempts.filter((x) => x.lift_type === "CJ" && x.result === "OK").map((x) => x.weight_kg), 0);
  const prTotal = Math.max(
    ...data.results.filter((r) => athleteEntries.some((e) => e.id === r.entry_id)).map((r) => r.total),
    0
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{a.full_name}</h1>
          <div className="text-neutral-400">{a.nationality} • Born {fmtDate(a.dob)}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>PR Snatch: {prSN ? kg(prSN) : "—"}</Badge>
          <Badge>PR C&J: {prCJ ? kg(prCJ) : "—"}</Badge>
          <Badge>Total: {prTotal ? kg(prTotal) : "—"}</Badge>
        </div>
      </div>

      <Section title="Competition Results">
        <div className="space-y-3">
          {athleteEntries.map((e) => {
            const r = resultByEntry(e.id, data);
            const ses = byId(data.sessions, e.session_id);
            const cmp = byId(data.competitions, ses.competition_id);
            return (
              <Card key={e.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium"><a className="hover:underline" href={`#/competitions/${cmp.id}`}>{cmp.name}</a></div>
                    <div className="text-sm text-neutral-400">{fmtDate(cmp.start_date)} • Group {ses.group_label}</div>
                  </div>
                  <div className="text-sm text-right text-neutral-300">
                    <div>Snatch: {r?.best_sn ? kg(r.best_sn) : "—"}</div>
                    <div>C&J: {r?.best_cj ? kg(r.best_cj) : "—"}</div>
                    <div>Total: {r?.total ? kg(r.total) : "—"} {r?.placing ? `• #${r.placing}` : ""}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <button onClick={() => openLift(e.id)} className="text-xs rounded-lg px-3 py-1 border border-neutral-700 hover:bg-neutral-800/60">View Attempts</button>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

const AthletesIndex = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, country, total
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [filterCountry, setFilterCountry] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (!data) return <div className="p-6">Loading...</div>;

  // Calculate total lift for each athlete
  const athletesWithTotals = useMemo(() => {
    return data.athletes.map(athlete => {
      // Find all entries for this athlete
      const athleteEntries = data.entries.filter(entry => entry.athlete_id === athlete.id);
      
      // Find all results for these entries
      const athleteResults = data.results.filter(result => 
        athleteEntries.some(entry => entry.id === result.entry_id)
      );
      
      // Get the best total lift
      const bestTotal = athleteResults.length > 0 
        ? Math.max(...athleteResults.map(r => r.total || 0))
        : 0;
      
      return {
        ...athlete,
        bestTotal
      };
    });
  }, [data]);

  // Filter and sort athletes
  const filteredAndSortedAthletes = useMemo(() => {
    let filtered = athletesWithTotals.filter(athlete => {
      const matchesSearch = athlete.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = !filterCountry || athlete.nationality === filterCountry;
      return matchesSearch && matchesCountry;
    });

    // Sort athletes
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case "country":
          aValue = a.nationality;
          bValue = b.nationality;
          break;
        case "total":
          aValue = a.bestTotal;
          bValue = b.bestTotal;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [athletesWithTotals, searchTerm, filterCountry, sortBy, sortOrder]);

  // Get unique countries for filter dropdown
  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(data.athletes.map(a => a.nationality))];
    return uniqueCountries.sort();
  }, [data.athletes]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAthletes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAthletes = filteredAndSortedAthletes.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const SortButton = ({ column, children }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-white transition-colors"
    >
      {children}
      {sortBy === column && (
        <span className="text-xs">
          {sortOrder === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Athletes</h1>
        <div className="text-sm text-neutral-400">
          {filteredAndSortedAthletes.length} athletes
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl bg-neutral-900/70 border border-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-700"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={filterCountry}
            onChange={(e) => {
              setFilterCountry(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl bg-neutral-900/70 border border-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-700"
          >
            <option value="">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Athletes Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="text-left py-3 px-4">
                  <SortButton column="name">Name</SortButton>
                </th>
                <th className="text-left py-3 px-4">
                  <SortButton column="country">Country</SortButton>
                </th>
                <th className="text-left py-3 px-4">Gender</th>
                <th className="text-left py-3 px-4">Born</th>
                <th className="text-right py-3 px-4">
                  <SortButton column="total">Best Total</SortButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAthletes.map((athlete) => (
                <tr key={athlete.id} className="border-t border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <a 
                      href={`#/athletes/${athlete.id}`} 
                      className="font-medium hover:text-white hover:underline transition-colors"
                    >
                      {athlete.full_name}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-neutral-300">{athlete.nationality}</td>
                  <td className="py-3 px-4 text-neutral-300">
                    {athlete.gender === "M" ? "Men" : "Women"}
                  </td>
                  <td className="py-3 px-4 text-neutral-300">
                    {athlete.dob ? fmtDate(athlete.dob) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right text-neutral-300">
                    {athlete.bestTotal > 0 ? kg(athlete.bestTotal) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
            <div className="text-sm text-neutral-400">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedAthletes.length)} of {filteredAndSortedAthletes.length} athletes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-neutral-700 hover:bg-neutral-800/60 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-neutral-700 hover:bg-neutral-800/60 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const RecordsPage = ({ data }) => {
  if (!data) return <div className="p-6">Loading...</div>;
  
  const recs = data.records;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Records</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recs.map((r) => {
          const wc = byId(data.weightClasses, r.weight_class_id);
          const ath = byId(data.athletes, r.holder_athlete_id);
          const cmp = byId(data.competitions, r.competition_id);
          return (
            <Card key={r.id} className="p-4">
              <div className="text-sm text-neutral-400">{byId(data.federations, r.federation_id)?.code} • {wc?.label} • {r.record_type}</div>
              <div className="text-2xl font-semibold mt-1">{kg(r.weight_kg)}</div>
              <div className="mt-1"><a href={`#/athletes/${ath.id}`} className="hover:underline">{ath.full_name}</a></div>
              <div className="text-sm text-neutral-400">{fmtDate(r.set_date)} at <a className="hover:underline" href={`#/competitions/${cmp.id}`}>{cmp.name}</a></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Lift Viewer Modal with timed YouTube embed
const LiftViewer = ({ entryId, onClose, data }) => {
  if (!data) return null;
  
  const attempts = attemptsByEntry(entryId, data);
  const athlete = useMemo(() => {
    const e = data.entries.find((x) => x.id === entryId);
    return e ? byId(data.athletes, e.athlete_id) : undefined;
  }, [entryId, data]);

  const [activeAttId, setActiveAttId] = useState(attempts[0]?.id);
  const activeAttempt = attempts.find((a) => a.id === activeAttId);
  const activeVideo = activeAttempt?.video_id ? videoById(activeAttempt.video_id, data) : undefined;

  // YouTube URL with start param; we do not auto set end to keep playback smooth in preview
  const ytUrl = activeVideo?.source === "YOUTUBE"
    ? `https://www.youtube.com/embed/${activeVideo.external_id}?start=${Math.floor((activeVideo.start_ms || 0)/1000)}&autoplay=0&modestbranding=1`
    : undefined;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="font-medium">{athlete?.full_name} — Attempts</div>
          <button onClick={onClose} className="rounded-lg border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800/60">Close</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          <div className="lg:col-span-2">
            {ytUrl ? (
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-neutral-800">
                <iframe
                  title="Attempt Video"
                  src={ytUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-video w-full grid place-items-center border border-neutral-800 rounded-xl text-neutral-400">No video linked</div>
            )}
          </div>
          <div className="space-y-2">
            {attempts.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveAttId(a.id)}
                className={`w-full text-left rounded-xl border px-3 py-2 ${activeAttId===a.id?"border-white bg-white/5":"border-neutral-800 hover:border-neutral-700"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{a.lift_type} {a.attempt_no} — {kg(a.weight_kg)}</div>
                  <Badge className={a.result === "OK" ? "bg-emerald-700/70" : "bg-red-800/70"}>{a.result}</Badge>
                </div>
                {a.video_id && <div className="text-xs text-neutral-400 mt-1">Linked video</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Router wrapper
const Router = () => {
  const route = useHashRoute();
  const [liftEntryId, setLiftEntryId] = useState(null);
  const { data, loading, error } = useData();

  console.log('🔍 Router state:', { route, loading, error, hasData: !!data });

  useEffect(() => {
    // close lift modal when navigating away
    const onHash = () => setLiftEntryId(null);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (loading) {
    console.log('📱 Rendering loading state');
    return (
      <>
        <Nav data={null} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg">Loading...</div>
            <div className="text-sm text-neutral-400 mt-2">Fetching data...</div>
            <div className="text-xs text-neutral-500 mt-4">
              If this takes too long, check the browser console for errors
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    console.log('❌ Rendering error state:', error);
    return (
      <>
        <Nav data={null} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg text-red-400">Error loading data</div>
            <div className="text-sm text-neutral-400 mt-2">Falling back to mock data</div>
            <div className="text-xs text-neutral-500 mt-4 p-4 bg-neutral-800 rounded">
              <pre>{JSON.stringify(error, null, 2)}</pre>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!data) {
    console.log('❌ No data available, showing fallback with mock data');
    // Use mock data as fallback
    const fallbackData = mockDB;
    return (
      <>
        <Nav data={fallbackData} />
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
            <div className="text-yellow-400 font-medium">Using fallback data</div>
            <div className="text-sm text-yellow-300 mt-1">Data loading failed, showing mock data instead</div>
          </div>
          <Home data={fallbackData} />
        </div>
        <Footer />
      </>
    );
  }

  let page = null;
  if (route.startsWith("/competitions/")) {
    const id = route.split("/")[2];
    page = <CompetitionPage id={id} openLift={(entryId)=>setLiftEntryId(entryId)} data={data} />;
  } else if (route === "/competitions") {
    page = <CompetitionsIndex data={data} />;
  } else if (route.startsWith("/athletes/")) {
    const id = route.split("/")[2];
    page = <AthletePage id={id} openLift={(entryId)=>setLiftEntryId(entryId)} data={data} />;
  } else if (route === "/athletes") {
    page = <AthletesIndex data={data} />;
  } else if (route === "/records") {
    page = <RecordsPage data={data} />;
  } else {
    page = <Home data={data} />;
  }

  return (
    <>
      <Nav data={data} />
      {page}
      {liftEntryId && <LiftViewer entryId={liftEntryId} onClose={() => setLiftEntryId(null)} data={data} />}
      <Footer />
    </>
  );
};

const Footer = () => (
  <footer className="mt-16 border-t border-neutral-800">
    <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-neutral-400 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
      <div>goodlift.io — demo MVP. Replace mock data with your API.</div>
      <div className="flex gap-4">
        <a className="hover:underline" href="#/competitions">Competitions</a>
        <a className="hover:underline" href="#/athletes">Athletes</a>
        <a className="hover:underline" href="#/records">Records</a>
      </div>
    </div>
  </footer>
);

export default function App() {
  console.log('🚀 App component rendering');
  
  useEffect(() => {
    console.log('🎨 Setting up dark theme');
    document.documentElement.classList.add("dark");
    document.body.className = "bg-black text-white min-h-screen";
  }, []);
  
  return <Router />;
}
