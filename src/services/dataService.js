import { supabase, TABLES } from '../config/supabase.js'

// Mock data (moved here to avoid circular dependency)
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
    { id: "ses_awc25_w45A", competition_id: "cmp_awc_2025", date_time: "2025-05-09T09:00:00Z", gender: "F", weight_class_id: "W45-2018", group_label: "A", platform_label: "Platform 1", sort_order: 1 },
    { id: "ses_awc25_w49A", competition_id: "cmp_awc_2025", date_time: "2025-05-09T13:00:00Z", gender: "F", weight_class_id: "W49-2018", group_label: "A", platform_label: "Platform 1", sort_order: 2 },
    { id: "ses_awc25_m55A", competition_id: "cmp_awc_2025", date_time: "2025-05-09T17:00:00Z", gender: "M", weight_class_id: "M55-2018", group_label: "A", platform_label: "Platform 1", sort_order: 3 },
    { id: "ses_awc25_m61A", competition_id: "cmp_awc_2025", date_time: "2025-05-10T14:00:00Z", gender: "M", weight_class_id: "M61-2018", group_label: "A", platform_label: "Platform 1", sort_order: 4 },
    { id: "ses1", competition_id: "cmp_worlds_2024", date_time: "2024-11-05T18:00:00Z", gender: "M", weight_class_id: "M73-2018", group_label: "A", platform_label: "Platform 1", sort_order: 5 },
    { id: "ses2", competition_id: "cmp_worlds_2024", date_time: "2024-11-06T18:00:00Z", gender: "F", weight_class_id: "W64-legacy", group_label: "A", platform_label: "Platform 1", sort_order: 6 },
    { id: "ses3", competition_id: "cmp_continental_2025", date_time: "2025-04-15T16:00:00Z", gender: "M", weight_class_id: "M81-2018", group_label: "A", platform_label: "Platform 2", sort_order: 7 },
  ],
  athletes: [
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
    { id: "ath_001", full_name: "Li Fabin", gender: "M", nationality: "CHN", dob: "1993-01-15" },
    { id: "ath_002", full_name: "Karlos Nasar", gender: "M", nationality: "BUL", dob: "2004-05-04" },
    { id: "ath_003", full_name: "Sara Ahmed", gender: "F", nationality: "EGY", dob: "1998-01-01" },
  ],
  entries: [
    { id: "ent_awc25_w45_zhj", session_id: "ses_awc25_w45A", athlete_id: "ath_zhao_jinhong", lot: 154, declared_sn: 88, declared_cj: 100 },
    { id: "ent_awc25_w45_hzy", session_id: "ses_awc25_w45A", athlete_id: "ath_hong_ziyu", lot: 146, declared_sn: 70, declared_cj: 88 },
    { id: "ent_awc25_w45_pdt", session_id: "ses_awc25_w45A", athlete_id: "ath_pham_dinh_thi", lot: 68, declared_sn: 68, declared_cj: 85 },
    { id: "ent_awc25_w45_ntt", session_id: "ses_awc25_w45A", athlete_id: "ath_nguyen_thu_trang", lot: 138, declared_sn: 65, declared_cj: 65 },
    { id: "ent_awc25_w45_btg", session_id: "ses_awc25_w45A", athlete_id: "ath_batnasan_tungalag", lot: 133, declared_sn: 62, declared_cj: 75 },
    { id: "ent_awc25_w45_bms", session_id: "ses_awc25_w45A", athlete_id: "ath_bristy_mst", lot: 36, declared_sn: 60, declared_cj: 77 },
    { id: "ent_001", session_id: "ses1", athlete_id: "ath_001", lot: 8, declared_sn: 140, declared_cj: 170 },
    { id: "ent_002", session_id: "ses1", athlete_id: "ath_002", lot: 3, declared_sn: 158, declared_cj: 196 },
    { id: "ent_003", session_id: "ses2", athlete_id: "ath_003", lot: 6, declared_sn: 115, declared_cj: 146 },
    { id: "ent_004", session_id: "ses3", athlete_id: "ath_002", lot: 2, declared_sn: 165, declared_cj: 205 },
  ],
  attempts: [
    { id: "att_awc25_w45_zhj_sn3", entry_id: "ent_awc25_w45_zhj", lift_type: "SN", attempt_no: 3, weight_kg: 90, result: "OK", timestamp: "2025-05-09T09:20:00Z", video_id: undefined },
    { id: "att_awc25_w45_zhj_cj3", entry_id: "ent_awc25_w45_zhj", lift_type: "CJ", attempt_no: 3, weight_kg: 100, result: "OK", timestamp: "2025-05-09T09:45:00Z", video_id: undefined },
    { id: "att_1001", entry_id: "ent_002", lift_type: "SN", attempt_no: 1, weight_kg: 156, result: "OK", timestamp: "2024-11-05T18:22:31Z", video_id: "vid_nasar_156sn" },
    { id: "att_1002", entry_id: "ent_002", lift_type: "SN", attempt_no: 2, weight_kg: 161, result: "OK", timestamp: "2024-11-05T18:44:31Z", video_id: "vid_nasar_161sn" },
    { id: "att_1003", entry_id: "ent_002", lift_type: "SN", attempt_no: 3, weight_kg: 168, result: "XX", timestamp: "2024-11-05T18:51:31Z", video_id: "vid_nasar_168sn" },
    { id: "att_1004", entry_id: "ent_002", lift_type: "CJ", attempt_no: 1, weight_kg: 191, result: "OK", timestamp: "2024-11-05T19:12:31Z", video_id: "vid_nasar_191cj" },
    { id: "att_1005", entry_id: "ent_002", lift_type: "CJ", attempt_no: 2, weight_kg: 196, result: "OK", timestamp: "2024-11-05T19:26:31Z", video_id: "vid_nasar_196cj" },
    { id: "att_1006", entry_id: "ent_002", lift_type: "CJ", attempt_no: 3, weight_kg: 201, result: "XX", timestamp: "2024-11-05T19:39:31Z", video_id: "vid_nasar_201cj" },
  ],
  results: [
    { id: "res_awc25_w45_1", entry_id: "ent_awc25_w45_zhj", best_sn: 90, best_cj: 100, total: 190, placing: 1, bodyweight_kg: 44.9, points: undefined },
    { id: "res_awc25_w45_2", entry_id: "ent_awc25_w45_hzy", best_sn: 73, best_cj: 88, total: 161, placing: 2, bodyweight_kg: undefined, points: undefined },
    { id: "res_ent_002", entry_id: "ent_002", best_sn: 161, best_cj: 196, total: 357, placing: 1, bodyweight_kg: 80.8, points: 200.3 },
    { id: "res_ent_001", entry_id: "ent_001", best_sn: 145, best_cj: 173, total: 318, placing: 3, bodyweight_kg: 72.9, points: 184.1 },
    { id: "res_ent_003", entry_id: "ent_003", best_sn: 114, best_cj: 146, total: 260, placing: 1, bodyweight_kg: 63.8, points: 178.6 },
    { id: "res_ent_004", entry_id: "ent_004", best_sn: 165, best_cj: 205, total: 370, placing: 1, bodyweight_kg: 80.9, points: 205.7 },
  ],
  videos: [
    { id: "vid_nasar_156sn", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 121000, end_ms: 123500 },
    { id: "vid_nasar_161sn", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 184500, end_ms: 186800 },
    { id: "vid_nasar_168sn", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 232000, end_ms: 234500 },
    { id: "vid_nasar_191cj", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 301000, end_ms: 303800 },
    { id: "vid_nasar_196cj", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 342000, end_ms: 344800 },
    { id: "vid_nasar_201cj", source: "YOUTUBE", external_id: "x1y2z3", start_ms: 388000, end_ms: 390600 },
  ],
  records: [
    { id: "rec1", federation_id: "iwf", weight_class_id: "M81-2018", gender: "M", record_type: "TOTAL", weight_kg: 396, holder_athlete_id: "ath_002", set_date: "2025-04-15", competition_id: "cmp_continental_2025" },
  ],
}

// Configuration for data source
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true'
const FALLBACK_TO_MOCK = import.meta.env.VITE_FALLBACK_TO_MOCK !== 'false'

// Always fallback to mock data if Supabase is not properly configured
// Force mock data for now to prevent 404 errors
const shouldUseSupabase = false

console.log('🔧 DataService config:', {
  USE_SUPABASE,
  FALLBACK_TO_MOCK,
  shouldUseSupabase,
  hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
})

// Helper function to handle Supabase errors and fallback to mock data
const handleSupabaseError = (error, fallbackData) => {
  console.error('Supabase error:', error)
  if (FALLBACK_TO_MOCK) {
    console.log('Falling back to mock data')
    return fallbackData
  }
  throw error
}

// Generic function to fetch data from Supabase with fallback
const fetchFromSupabase = async (tableName, fallbackData) => {
  if (!shouldUseSupabase || !supabase) {
    console.log(`Using mock data for ${tableName} (Supabase not configured)`)
    return fallbackData
  }

  try {
    const { data, error } = await supabase.from(tableName).select('*')
    if (error) throw error
    return data || fallbackData
  } catch (error) {
    return handleSupabaseError(error, fallbackData)
  }
}

// Generic function to fetch data with filters
const fetchFromSupabaseWithFilter = async (tableName, column, value, fallbackData) => {
  if (!shouldUseSupabase || !supabase) {
    return fallbackData.filter(item => item[column] === value)
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(column, value)
    
    if (error) throw error
    return data || fallbackData.filter(item => item[column] === value)
  } catch (error) {
    return handleSupabaseError(error, fallbackData.filter(item => item[column] === value))
  }
}

// Data service functions
export const dataService = {
  // Federations
  getFederations: () => fetchFromSupabase(TABLES.FEDERATIONS, mockDB.federations),
  
  // Weight Classes
  getWeightClasses: () => fetchFromSupabase(TABLES.WEIGHT_CLASSES, mockDB.weightClasses),
  
  // Competitions
  getCompetitions: () => fetchFromSupabase(TABLES.COMPETITIONS, mockDB.competitions),
  getCompetitionById: (id) => {
    if (!USE_SUPABASE) {
      return mockDB.competitions.find(c => c.id === id)
    }
    
    return fetchFromSupabaseWithFilter(TABLES.COMPETITIONS, 'id', id, mockDB.competitions)
      .then(results => results[0])
  },
  
  // Sessions
  getSessions: () => fetchFromSupabase(TABLES.SESSIONS, mockDB.sessions),
  getSessionsByCompetition: (competitionId) => {
    if (!USE_SUPABASE) {
      return mockDB.sessions
        .filter(s => s.competition_id === competitionId)
        .sort((a, b) => a.sort_order - b.sort_order)
    }
    
    return fetchFromSupabaseWithFilter(TABLES.SESSIONS, 'competition_id', competitionId, mockDB.sessions)
      .then(results => results.sort((a, b) => a.sort_order - b.sort_order))
  },
  
  // Athletes
  getAthletes: () => fetchFromSupabase(TABLES.ATHLETES, mockDB.athletes),
  getAthleteById: (id) => {
    if (!USE_SUPABASE) {
      return mockDB.athletes.find(a => a.id === id)
    }
    
    return fetchFromSupabaseWithFilter(TABLES.ATHLETES, 'id', id, mockDB.athletes)
      .then(results => results[0])
  },
  searchAthletes: (query) => {
    if (!USE_SUPABASE) {
      const term = query.toLowerCase()
      return mockDB.athletes.filter(a => 
        a.full_name.toLowerCase().includes(term)
      )
    }
    
    return fetchFromSupabase(TABLES.ATHLETES, mockDB.athletes)
      .then(athletes => {
        const term = query.toLowerCase()
        return athletes.filter(a => 
          a.full_name.toLowerCase().includes(term)
        )
      })
  },
  
  // Entries
  getEntries: () => fetchFromSupabase(TABLES.ENTRIES, mockDB.entries),
  getEntriesBySession: (sessionId) => {
    if (!USE_SUPABASE) {
      return mockDB.entries.filter(e => e.session_id === sessionId)
    }
    
    return fetchFromSupabaseWithFilter(TABLES.ENTRIES, 'session_id', sessionId, mockDB.entries)
  },
  getEntriesByAthlete: (athleteId) => {
    if (!USE_SUPABASE) {
      return mockDB.entries.filter(e => e.athlete_id === athleteId)
    }
    
    return fetchFromSupabaseWithFilter(TABLES.ENTRIES, 'athlete_id', athleteId, mockDB.entries)
  },
  
  // Attempts
  getAttempts: () => fetchFromSupabase(TABLES.ATTEMPTS, mockDB.attempts),
  getAttemptsByEntry: (entryId) => {
    if (!USE_SUPABASE) {
      return mockDB.attempts
        .filter(a => a.entry_id === entryId)
        .sort((a, b) => (a.lift_type + a.attempt_no).localeCompare(b.lift_type + b.attempt_no))
    }
    
    return fetchFromSupabaseWithFilter(TABLES.ATTEMPTS, 'entry_id', entryId, mockDB.attempts)
      .then(results => results.sort((a, b) => (a.lift_type + a.attempt_no).localeCompare(b.lift_type + b.attempt_no)))
  },
  
  // Results
  getResults: () => fetchFromSupabase(TABLES.RESULTS, mockDB.results),
  getResultByEntry: (entryId) => {
    if (!USE_SUPABASE) {
      return mockDB.results.find(r => r.entry_id === entryId)
    }
    
    return fetchFromSupabaseWithFilter(TABLES.RESULTS, 'entry_id', entryId, mockDB.results)
      .then(results => results[0])
  },
  
  // Videos
  getVideos: () => fetchFromSupabase(TABLES.VIDEOS, mockDB.videos),
  getVideoById: (id) => {
    if (!USE_SUPABASE) {
      return mockDB.videos.find(v => v.id === id)
    }
    
    return fetchFromSupabaseWithFilter(TABLES.VIDEOS, 'id', id, mockDB.videos)
      .then(results => results[0])
  },
  
  // Records
  getRecords: () => fetchFromSupabase(TABLES.RECORDS, mockDB.records),
  
  // Search functionality
  searchCompetitions: (query) => {
    if (!USE_SUPABASE) {
      const term = query.toLowerCase()
      return mockDB.competitions.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.city.toLowerCase().includes(term) ||
        c.country.toLowerCase().includes(term)
      )
    }
    
    return fetchFromSupabase(TABLES.COMPETITIONS, mockDB.competitions)
      .then(competitions => {
        const term = query.toLowerCase()
        return competitions.filter(c => 
          c.name.toLowerCase().includes(term) ||
          c.city.toLowerCase().includes(term) ||
          c.country.toLowerCase().includes(term)
        )
      })
  },
  
  // Utility functions
  byId: (arr, id) => arr.find(x => x.id === id),
  
  // Get all data at once (useful for initial load)
  getAllData: async () => {
    console.log('🔄 getAllData called, shouldUseSupabase:', shouldUseSupabase)
    
    if (!shouldUseSupabase) {
      console.log('✅ Using mock data (Supabase not configured)')
      return mockDB
    }
    
    try {
      console.log('🔄 Attempting to fetch from Supabase...')
      const [
        federations,
        weightClasses,
        competitions,
        sessions,
        athletes,
        entries,
        attempts,
        results,
        videos,
        records
      ] = await Promise.all([
        fetchFromSupabase(TABLES.FEDERATIONS, mockDB.federations),
        fetchFromSupabase(TABLES.WEIGHT_CLASSES, mockDB.weightClasses),
        fetchFromSupabase(TABLES.COMPETITIONS, mockDB.competitions),
        fetchFromSupabase(TABLES.SESSIONS, mockDB.sessions),
        fetchFromSupabase(TABLES.ATHLETES, mockDB.athletes),
        fetchFromSupabase(TABLES.ENTRIES, mockDB.entries),
        fetchFromSupabase(TABLES.ATTEMPTS, mockDB.attempts),
        fetchFromSupabase(TABLES.RESULTS, mockDB.results),
        fetchFromSupabase(TABLES.VIDEOS, mockDB.videos),
        fetchFromSupabase(TABLES.RECORDS, mockDB.records)
      ])
      
      const result = {
        federations,
        weightClasses,
        competitions,
        sessions,
        athletes,
        entries,
        attempts,
        results,
        videos,
        records
      }
      
      console.log('✅ Successfully fetched data from Supabase:', result)
      return result
    } catch (error) {
      console.error('❌ Error fetching all data from Supabase:', error)
      console.log('🔄 Falling back to mock data')
      return mockDB
    }
  }
}
