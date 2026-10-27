// Keyword Prescriptions & Rule Matching Engine

export const evaluateMessageAgainstRules = (messageText, rules, groupName = '') => {
  const textLower = messageText.toLowerCase();
  const matchedRules = [];
  const matchedKeywordsList = [];
  let highestPriority = 'LOW';
  let isFlagged = false;

  const priorityWeights = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  };

  rules.filter(rule => rule.enabled).forEach(rule => {
    // Check group scoping
    if (rule.targetGroups && rule.targetGroups.length > 0 && !rule.targetGroups.includes('ALL')) {
      if (!rule.targetGroups.includes(groupName)) {
        return; // Group not target for this rule
      }
    }

    // Check excluded words first
    if (rule.excludedWords && rule.excludedWords.length > 0) {
      const hasExcluded = rule.excludedWords.some(word => 
        word.trim() && textLower.includes(word.trim().toLowerCase())
      );
      if (hasExcluded) return; // Skip if contains excluded word
    }

    let isMatch = false;
    const ruleKeywords = rule.keywords.map(k => k.trim()).filter(Boolean);

    if (rule.matchType === 'EXACT_PHRASE') {
      isMatch = ruleKeywords.some(phrase => textLower.includes(phrase.toLowerCase()));
    } else if (rule.matchType === 'ALL_KEYWORDS') {
      // Must contain ALL keywords
      isMatch = ruleKeywords.length > 0 && ruleKeywords.every(k => textLower.includes(k.toLowerCase()));
    } else {
      // ANY_KEYWORD (Default)
      isMatch = ruleKeywords.some(k => textLower.includes(k.toLowerCase()));
    }

    if (isMatch) {
      isFlagged = true;
      matchedRules.push(rule);
      
      // Extract matched individual terms
      ruleKeywords.forEach(k => {
        if (textLower.includes(k.toLowerCase()) && !matchedKeywordsList.includes(k)) {
          matchedKeywordsList.push(k);
        }
      });

      // Track highest priority
      if (priorityWeights[rule.priority] > (priorityWeights[highestPriority] || 0)) {
        highestPriority = rule.priority;
      }
    }
  });

  // Calculate simple sentiment assessment based on keywords & text cues
  let sentiment = 'NEUTRAL';
  const urgentCues = ['urgent', 'immediately', 'critical', 'emergency', 'asap', 'broken', 'breach', 'scam', 'hack'];
  const positiveCues = ['great', 'love', 'thanks', 'awesome', 'good', 'approved', 'recommend', 'excited'];
  const negativeCues = ['bad', 'worst', 'fail', 'terrible', 'cancel', 'lawsuit', 'complaint', 'fraud'];

  if (urgentCues.some(c => textLower.includes(c)) || highestPriority === 'CRITICAL') {
    sentiment = 'URGENT';
  } else if (negativeCues.some(c => textLower.includes(c))) {
    sentiment = 'NEGATIVE';
  } else if (positiveCues.some(c => textLower.includes(c))) {
    sentiment = 'POSITIVE';
  }

  return {
    isMatch: isFlagged,
    matchedRules,
    matchedKeywords: matchedKeywordsList,
    highestPriority: isFlagged ? highestPriority : null,
    sentiment
  };
};

export const highlightKeywords = (text, keywords = []) => {
  if (!keywords || keywords.length === 0) return text;
  
  // Sort keywords by length descending to match longer phrases first
  const sortedKw = [...keywords].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sortedKw.map(k => k.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')})`, 'gi');

  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    const isKeyword = sortedKw.some(k => k.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return `<mark class="kw-highlight" key="${idx}">${part}</mark>`;
    }
    return part;
  }).join('');
};
