// /api/generate.js — Vercel Serverless Function (Node.js)
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // Read JSON body safely
  const body = await new Promise((resolve, reject) => {
    try {
      let data = '';
      req.on('data', (c) => (data += c));
      req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
      });
      req.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });

  const { niche = '', platform = 'Instagram', style = 'punchy', lang = 'ru', extras = '' } = body || {};

  const styleMap = {
    punchy: 'punchy, benefit-first, crisp CTA, light emojis where natural',
    humor: 'light-humor, clever, friendly but still clear on value',
    serious: 'professional, concise, credibility-forward',
    story: 'mini-story hook, transformation, clear CTA'
  };

  const sys = 'You craft ultra-short, high-converting social bios and captions. Keep to platform norms. Max 300 characters for Instagram/TikTok, 220 for Twitter, up to 260 for LinkedIn headline. Add one clear CTA.';
  const prompt = `Create a ${platform} bio/caption in ${lang}. Style: ${styleMap[style]}. Niche: "${niche}". Extra details: "${extras}". Return ONLY the bio/caption, no preface.`;

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 180
      })
    });

    const textBody = await r.text();
    if (!r.ok) {
      return res.status(500).json({ error: 'openai_failed', info: textBody.substring(0, 400) });
    }

    const j = JSON.parse(textBody);
    const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) ? j.choices[0].message.content.trim() : '';

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
