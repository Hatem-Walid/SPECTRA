// الكود يختار السيرفر أوتوماتيكياً حسب مكان التشغيل:
const FASTAPI_URL = import.meta.env.DEV
  ? "http://localhost:8000"                             // 💻 يشتغل على الكمبيوتر المحلي تلقائياً
  : "https://spectra-production-a64d.up.railway.app";    // 🌐 يشتغل على السيرفر الأونلاين تلقائياً
// قراءة المفتاح بأمان من ملف .env
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ============================================================
// قائمة الأعمدة وقالب الـ 41 فيتشر لموديل الاختراق (NSL-KDD)
// ============================================================
const _INTRUSION_COLUMNS = [
  "duration", "protocol_type", "service", "flag", "src_bytes",
  "dst_bytes", "land", "wrong_fragment", "urgent", "hot",
  "num_failed_logins", "logged_in", "num_compromised", "root_shell",
  "su_attempted", "num_root", "num_file_creations", "num_shells",
  "num_access_files", "num_outbound_cmds", "is_host_login",
  "is_guest_login", "count", "srv_count", "serror_rate",
  "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate",
  "diff_srv_rate", "srv_diff_host_rate", "dst_host_count",
  "dst_host_srv_count", "dst_host_same_srv_rate", "dst_host_diff_srv_rate",
  "dst_host_same_src_port_rate", "dst_host_srv_diff_host_rate",
  "dst_host_serror_rate", "dst_host_srv_serror_rate",
  "dst_host_rerror_rate", "dst_host_srv_rerror_rate"
];

const NSL_KDD_41_TEMPLATE = {
  duration: 0, protocol_type: "tcp", service: "http", flag: "SF",
  src_bytes: 181, dst_bytes: 5450, land: 0, wrong_fragment: 0, urgent: 0,
  hot: 0, num_failed_logins: 0, logged_in: 1, num_compromised: 0, root_shell: 0,
  su_attempted: 0, num_root: 0, num_file_creations: 0, num_shells: 0,
  num_access_files: 0, num_outbound_cmds: 0, is_host_login: 0, is_guest_login: 0,
  count: 8, srv_count: 8, serror_rate: 0.0, srv_serror_rate: 0.0, rerror_rate: 0.0,
  srv_rerror_rate: 0.0, same_srv_rate: 1.0, diff_srv_rate: 0.0, srv_diff_host_rate: 0.0,
  dst_host_count: 9, dst_host_srv_count: 9, dst_host_same_srv_rate: 1.0,
  dst_host_diff_srv_rate: 0.0, dst_host_same_src_port_rate: 0.11,
  dst_host_srv_diff_host_rate: 0.0, dst_host_serror_rate: 0.0,
  dst_host_srv_serror_rate: 0.0, dst_host_rerror_rate: 0.0, dst_host_srv_rerror_rate: 0.0
};

// ============================================================
// محرك استخراج البيانات الهجين (بدون أي نتائج فيك)
// ============================================================
export async function extractFields(tool, conversation, existingData = {}) {
  const lastUserMsg = (conversation[conversation.length - 1]?.content || "").trim();

  // 1. فحص هل المدخل JSON صريح
  try {
    const parsed = JSON.parse(lastUserMsg);
    return {
      ready: true,
      data: { ...existingData, ...parsed },
      reply: "Received structured data! Processing prediction..."
    };
  } catch {}

  // 2. إذا قام المستخدم بلصق سطر CSV في شات الاختراق مباشرة، نفككه بدقة بدل تجاهله
  if (tool === "intrusion" && lastUserMsg.includes(",")) {
    const lines = lastUserMsg.split("\n").filter(l => l.trim() && !l.toLowerCase().startsWith("duration"));
    if (lines.length > 0) {
      const values = lines[0].split(",").map(v => v.trim());
      if (values.length >= 10) {
        const parsedCsv = {};
        _INTRUSION_COLUMNS.forEach((col, idx) => {
          if (values[idx] !== undefined) parsedCsv[col] = values[idx];
        });
        return {
          ready: true,
          data: { ...existingData, ...parsedCsv },
          reply: "Parsed pasted packet parameters! Sending to model..."
        };
      }
    }
  }

  // 3. المحاولة عبر Gemini إذا كان المفتاح متوفراً
  if (GEMINI_KEY) {
    try {
      const systemInstruction = `
You are an intelligent data extractor for an ML system.
Tool: "${tool}".
Already known data: ${JSON.stringify(existingData)}.
Target for "insurance": age (int), sex ("male"|"female"), bmi (float), children (int), smoker ("yes"|"no"), region ("southwest"|"southeast"|"northwest"|"northeast").
Target for "intrusion": any network packet features.

Rules:
1. Merge new user info with known data.
2. If all required fields for "${tool}" are complete:
   Return JSON: {"ready": true, "data": {...}, "reply": "All details received! Running model..."}
3. If still missing fields:
   Return JSON: {"ready": false, "data": {...}, "reply": "Friendly message asking specifically for missing fields."}
Respond ONLY with valid JSON.`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\nUser message: "${lastUserMsg}"` }]
          }
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      };

      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(text);
        return {
          ready: parsed.ready,
          data: { ...existingData, ...(parsed.data || {}) },
          reply: parsed.reply
        };
      }
    } catch (err) {
      console.warn("Gemini unavailable, using local extractor.");
    }
  }

  // 4. المستخرج المحلي الصارم
  return runLocalMemoryExtraction(tool, lastUserMsg, existingData);
}

function runLocalMemoryExtraction(tool, text, existingData) {
  if (tool === "insurance") {
    const lower = text.toLowerCase();
    const merged = { ...existingData };

    const ageMatch = lower.match(/(\d+)\s*(?:years?|yo|age)/) || lower.match(/\bage[:\s]+(\d+)/);
    if (ageMatch) merged.age = parseInt(ageMatch[1], 10);

    const bmiMatch = lower.match(/bmi\s*[:\s]?\s*(\d+(?:\.\d+)?)/);
    if (bmiMatch) merged.bmi = parseFloat(bmiMatch[1]);

    const kidsMatch = lower.match(/(\d+)\s*(?:kids?|children|child)/) || lower.match(/children[:\s]+(\d+)/);
    if (kidsMatch) merged.children = parseInt(kidsMatch[1], 10);
    else if (lower.includes("no kid") || lower.includes("no child") || lower.includes("zero kid")) merged.children = 0;

    const sexMatch = lower.match(/\b(male|female)\b/);
    if (sexMatch) merged.sex = sexMatch[0];

    const smokerMatch = lower.match(/\b(non-smoker|never smoked|smoker|yes|no)\b/);
    if (smokerMatch) {
      merged.smoker = (smokerMatch[0].includes("non") || smokerMatch[0].includes("never") || smokerMatch[0] === "no") ? "no" : "yes";
    }

    const regionMatch = lower.match(/\b(southwest|southeast|northwest|northeast)\b/);
    if (regionMatch) merged.region = regionMatch[0];

    const missing = [];
    if (!merged.age) missing.push("Age");
    if (!merged.sex) missing.push("Sex (male/female)");
    if (!merged.bmi) missing.push("BMI");
    if (merged.children === undefined) missing.push("Children count");
    if (!merged.smoker) missing.push("Smoker (yes/no)");
    if (!merged.region) missing.push("Region (e.g. northwest)");

    if (missing.length === 0) {
      return {
        ready: true,
        data: merged,
        reply: "All details collected! Calculating insurance charges..."
      };
    } else {
      return {
        ready: false,
        data: merged,
        reply: `Please provide the remaining info: ${missing.join(", ")}.`
      };
    }
  }

  if (tool === "intrusion") {
    // صارم: لا نرسل باكت سليم فيك لو المستخدم كتب كلاماً غير مفهوم
    const hasData = existingData && Object.keys(existingData).length > 0;
    if (!hasData) {
      return {
        ready: false,
        data: {},
        reply: "⚠️ No valid packet features recognized. Please paste parameters in JSON format or select a sample from quick commands (⚡)."
      };
    }
    return {
      ready: true,
      data: existingData,
      reply: "Running intrusion classification..."
    };
  }

  return { ready: false, data: existingData, reply: "Please provide valid inputs." };
}

// ============================================================
// استدعاءات سيرفر FastAPI (تمرير الأخطاء الصريحة)
// ============================================================

export async function checkHealth() {
  const res = await fetch(`${FASTAPI_URL}/health`);
  if (!res.ok) throw new Error("Backend offline");
  return await res.json();
}

export async function predictInsurance(data) {
  const payload = {
    age: parseInt(data.age, 10),
    sex: String(data.sex).toLowerCase().trim(),
    bmi: parseFloat(data.bmi),
    children: parseInt(data.children || 0, 10),
    smoker: String(data.smoker).toLowerCase().trim(),
    region: String(data.region).toLowerCase().trim(),
  };

  const res = await fetch(`${FASTAPI_URL}/predict/regression`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Insurance model execution failed.");
  }
  return await res.json();
}

export async function predictIntrusion(data = {}) {
  const payload = { ...NSL_KDD_41_TEMPLATE, ...data };

  for (const key in payload) {
    if (typeof NSL_KDD_41_TEMPLATE[key] === "number" && typeof payload[key] === "string") {
      payload[key] = payload[key].includes(".") ? parseFloat(payload[key]) : parseInt(payload[key], 10);
    }
  }

  const res = await fetch(`${FASTAPI_URL}/predict/classification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let msg = "Intrusion model prediction failed.";
    if (Array.isArray(err.detail)) {
      msg = err.detail.map(e => `${e.loc?.slice(1).join('.') || 'field'}: ${e.msg}`).join(" | ");
    } else if (err.detail) {
      msg = err.detail;
    }
    throw new Error(msg);
  }

  return await res.json();
}

export async function predictLeafDisease(file) {
  if (!file) throw new Error("No image file provided.");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${FASTAPI_URL}/predict/image`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // إظهار الخطأ الصادر من السيرفر كرسالة حمراء صريحة
    throw new Error(err.detail || "Leaf model prediction failed on the server.");
  }

  return await res.json();
}