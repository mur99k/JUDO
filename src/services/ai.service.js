const SettingsRepo = require('../repositories/settings.repo');

const AIService = {
  async getResponse(message) {
    const apiKey = SettingsRepo.get('aiApiKey');
    if (!apiKey) {
      return 'عذراً، لم يتم إعداد مفتاح الذكاء الاصطناعي بعد. يمكنك ضبطه من صفحة الإعدادات.';
    }
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'أنت مساعد ذكي لنادي الريادة للجودو. أجب باللغة العربية الفصحى.' },
            { role: 'user', content: message }
          ],
          max_tokens: 200
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من معالجة طلبك';
    } catch {
      return 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي';
    }
  }
};

module.exports = AIService;
