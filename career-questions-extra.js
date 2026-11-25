'use strict';

// Load this file after index.html's inline career-chat script.
// It expands the interview before recommendations are generated.
if (Array.isArray(careerQuestions)) {
  const expandedCareerQuestions = [
    {
      text: 'これまでに「楽しい」「夢中になれた」と感じた経験を、具体的な場面で教えてください。何をしていて、どんなところが楽しかったですか？',
      choices: []
    },
    {
      text: '人から褒められたり、頼られたりすることは何ですか？思い当たる具体的な出来事もあれば教えてください。',
      choices: []
    },
    {
      text: '仕事では、どんな進め方が自分に合いそうですか？',
      choices: ['一人で集中して進める', 'チームで相談しながら進める', '両方をバランスよく', 'まだわからない']
    },
    {
      text: '人と関わる仕事について、どのくらいが心地よいですか？',
      choices: ['多くの人と接したい', '少人数とじっくり関わりたい', '必要なときだけ関わりたい', 'できるだけ少なめがよい']
    },
    {
      text: 'できれば避けたい業務や、負担に感じやすい状況はありますか？具体的な理由もあれば教えてください。',
      choices: []
    },
    {
      text: '働く環境について、譲れない条件や希望を教えてください。勤務時間、休日、通勤、在宅勤務、職場の雰囲気など、複数でも大丈夫です。',
      choices: []
    },
    {
      text: '仕事選びで特に大切にしたい条件を、優先順位も含めて教えてください。収入、安定、成長、やりがい、人間関係などがあります。',
      choices: []
    },
    {
      text: 'これまでの経験、学んだこと、資格、趣味や活動の中で、仕事に活かせそうなものはありますか？',
      choices: []
    },
    {
      text: '福井県内で希望する勤務地や、通勤できる範囲はありますか？また、働き始めたい時期に希望があれば教えてください。',
      choices: []
    },
    {
      text: '今の時点で気になっている職種や業界、反対に候補から外したいものはありますか？まだ決まっていなくても大丈夫です。',
      choices: []
    }
  ];
  careerQuestions.push(...expandedCareerQuestions);

  // Free-text answers that are too brief or uncertain get one specific follow-up.
  const originalSubmitCareerAnswer = submitCareerAnswer;
  const clarificationQuestions = new WeakSet();
  const vagueAnswerPattern = /^(わからない|分からない|特にない|ない|未定|なんとなく|まだ決めていない|思いつかない)[。.!！ ]*$/i;
  submitCareerAnswer = function(answer) {
    const clean = String(answer || '').trim();
    const currentQuestion = careerQuestions[careerStep];
    const isChoice = currentQuestion?.choices?.includes(clean) ?? false;
    const needsClarification = !isChoice && (clean.length < 12 || vagueAnswerPattern.test(clean));

    if (needsClarification && currentQuestion && !clarificationQuestions.has(currentQuestion)) {
      const clarification = {
        text: `もう少しイメージをつかむため、今の回答について具体例を教えてください。いつ・どんな場面でそう感じましたか？そのとき何をして、どうなりましたか？思い当たらない場合は「まだ思いつかない」でも大丈夫です。`,
        choices: []
      };
      clarificationQuestions.add(clarification);
      careerQuestions.splice(careerStep + 1, 0, clarification);
    }
    originalSubmitCareerAnswer(answer);
  };
}
