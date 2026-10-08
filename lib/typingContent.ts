import { createServerSupabaseClient } from '@/lib/supabase/server';

const DIVERSE_SSC_DEST_PASSAGES = [
  `The Constitution of India is the supreme legal framework that establishes the structure, procedures, powers, and duties of government institutions while setting out fundamental rights, directive principles, and the duties of citizens. It is the longest written constitution of any sovereign state in the world, embodying the democratic values and sovereign aspirations of a diverse nation. The preamble declares India a sovereign, socialist, secular, and democratic republic, committed to securing justice, liberty, equality, and fraternity for all individuals. Economic governance in modern India has witnessed significant administrative reforms aimed at streamlining service delivery, enhancing transparency, and leveraging digital infrastructure. The introduction of unified tax structures, standardized banking protocols, and digitized public procurement mechanisms has reduced procedural bottlenecks across multiple sectors of administration. Furthermore, national development initiatives emphasize sustainable infrastructure, environmental conservation, and equitable regional growth. Effective public administration relies heavily on accurate data documentation, swift official correspondence, and disciplined execution of statutory responsibilities. Civil servants and data operators bear the critical responsibility of maintaining public records with diligence and precision. As public services transition toward comprehensive digital governance, the speed and accuracy of record keeping remain fundamental to efficient governance, ensuring that citizen benefits and official notifications are processed transparently and without undue delays across all state and central departments.`,
  
  `Digital transformation across India has revolutionized public administration, financial inclusion, and citizen service delivery over the past decade. The integration of high-speed broadband connectivity, biometric identification systems, and instant digital payment gateways has made government schemes directly accessible to millions of beneficiaries in remote rural communities. Direct benefit transfers have eliminated intermediaries, curtailed leakages, and bolstered accountability in state welfare programs. At the same time, industrial policy has concentrated on expanding domestic manufacturing capacities through targeted financial incentives and infrastructure corridors. The development of dedicated freight corridors, modernization of port facilities, and expansion of renewable energy generation constitute the foundation of sustainable economic expansion. Sound fiscal management coupled with proactive monetary regulation has maintained stability amidst global market fluctuations. In this evolving administrative ecosystem, the role of administrative staff, secretarial assistants, and data entry personnel has become ever more vital. Precision in entering official statistical figures, formulating ministerial reports, and verifying citizen records determines the integrity of government databases. Maintaining high typing speed along with flawless typographic accuracy is an essential prerequisite for fulfilling administrative mandates and ensuring seamless operations across ministries and statutory commissions.`,

  `The Indian agricultural sector forms the backbone of the rural economy, providing livelihoods to a substantial portion of the country's population while ensuring national food security. In recent years, technological advancements such as precision farming, drone-assisted crop monitoring, and climate-resilient seed varieties have empowered farmers to optimize yields and mitigate climate risks. The expansion of institutional credit and automated direct income support mechanisms has reduced financial vulnerability in agrarian distress zones. In parallel, investment in cold storage facilities, rural warehousing corridors, and electronic national agriculture markets has bridged the gap between farm-gate realization and consumer pricing. Efficient data management in the Department of Agriculture enables policymakers to assess acreage projections, buffer stock allocations, and export quotas with scientific rigor. Rapid processing of crop insurance claims and prompt verification of beneficiary databases depend directly on the promptness and typographical accuracy of administrative personnel. As modern supply chains increasingly adopt digital ledgers and predictive analytics, the discipline of error-free record keeping remains indispensable for sustainable rural economic transformation.`,

  `Renewable energy expansion is a central pillar of India's long-term environmental and industrial strategy. The ambitious target of scaling non-fossil fuel capacity has spurred extensive investments in solar parks, offshore wind installations, and green hydrogen technology. Government policies such as performance-linked production incentives and dedicated green energy transmission corridors have accelerated private sector participation. Clean energy generation not only reduces carbon emissions but also mitigates the national trade deficit by decreasing dependence on imported fossil fuels. In addition, the electric mobility transition is reshaping urban transport systems through decentralized charging grids and battery storage manufacturing. Regulatory authorities and ministerial secretariats monitor compliance parameters, tariff schedules, and carbon credit registries on a daily basis. The documentation of energy generation metrics and legislative compliance reports demands meticulous attention to detail and rapid documentation capabilities from administrative assistants and computer operators handling critical statutory records.`,

  `Urban planning and smart city development represent pivotal frontiers in India's infrastructural modernization. Rapid urbanization necessitates integrated traffic management, sustainable waste recycling networks, energy-efficient public lighting, and comprehensive stormwater drainage solutions. Municipal corporations are increasingly adopting geographic information systems and centralized command centers to monitor civil amenities in real time. Affordable housing schemes equipped with sanitation, piped water connections, and clean cooking fuel have enhanced the quality of life for millions of urban households. The administrative machinery managing municipal revenues, property registrations, and building approvals relies heavily on digitized service counters. Fast and accurate keyboard operation ensures that public grievances, municipal notices, and infrastructural tenders are drafted, logged, and executed within established citizen charter deadlines without bureaucratic friction.`,

  `The expansion of India's aerospace and scientific research landscape reflects decades of dedicated institutional planning and indigenous technological development. Missions exploring lunar and planetary frontiers have demonstrated cost-effective engineering excellence and high scientific returns. The operationalization of navigational satellite constellations and Earth observation platforms supports disaster management, agricultural yield estimation, and marine navigational safety. Furthermore, commercial launch services have established India as a trusted international partner in global satellite deployment. Scientific secretariats, research councils, and defense procurement boards require continuous documentation of telemetry data, technical specifications, and budgetary disbursements. Accurate data entry and high clerical productivity are crucial to supporting scientific investigators and ensuring administrative protocols run without error.`,

  `Public health infrastructure has undergone substantial structural revitalization to guarantee universal access to quality medical services and preventative care. The expansion of primary healthcare centers into integrated wellness clinics provides free diagnostic screenings and essential medicines across rural and suburban districts. Simultaneously, national health insurance schemes have extended financial protection against catastrophic medical expenses to hundreds of millions of vulnerable families. Automated hospital management systems, digital health records, and centralized vaccine distribution networks have elevated operational transparency across public hospitals. Clerical staff managing medical supplies, patient admissions, and insurance authorizations play an essential role in preventing procedural delays and safeguarding public wellness records.`
];

/**
 * Strips HTML tags, trims excessive whitespace, and ensures proper spacing between words.
 */
function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/&[a-z0-9#]+;/gi, ' ') // Strip HTML entities
    .replace(/[\r\n\t]+/g, ' ') // Replace newlines and tabs with space
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces to single space
    .trim();
}

/**
 * Counts words in a text string
 */
function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Server-side function to fetch a random article's content or title from news_articles.
 * Dynamically randomizes query offsets, shuffles articles, and concatenates
 * until reaching approximately 400 words (for ~2000 key depressions).
 */
export async function getRandomTypingPassage(): Promise<{
  text: string;
  wordCount: number;
  characterCount: number;
  sourceArticlesCount: number;
}> {
  const TARGET_WORD_COUNT = 400;

  try {
    const supabase = createServerSupabaseClient();

    // 1. Get count of available articles to randomize query offset
    const { count } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true });

    let articles: { title: string; summary: string | null }[] | null = null;

    if (count && count > 0) {
      const pageSize = 40;
      const maxOffset = Math.max(0, count - pageSize);
      const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

      const { data, error } = await supabase
        .from('news_articles')
        .select('title, summary')
        .range(randomOffset, randomOffset + pageSize - 1);

      if (!error && data && data.length > 0) {
        articles = data;
      }
    }

    // If no articles found via offset, try basic query
    if (!articles || articles.length === 0) {
      const { data } = await supabase
        .from('news_articles')
        .select('title, summary')
        .limit(50);
      articles = data;
    }

    if (!articles || articles.length === 0) {
      return getRandomFallbackPassage();
    }

    // 2. Shuffle articles with Fisher-Yates
    const shuffled = [...articles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let accumulatedText = '';
    let articlesUsed = 0;

    for (const article of shuffled) {
      const summaryText = article.summary ? cleanText(article.summary) : '';
      const titleText = article.title ? cleanText(article.title) : '';

      let piece = '';
      if (summaryText.length > 40) {
        piece = summaryText;
      } else if (titleText) {
        piece = summaryText ? `${titleText}. ${summaryText}` : titleText;
      }

      if (!piece) continue;

      // Ensure proper end punctuation before joining
      piece = piece.trim();
      if (!/[.!?]$/.test(piece)) {
        piece += '.';
      }

      // Concatenate with a clear space delimiter
      accumulatedText = accumulatedText ? `${accumulatedText} ${piece}` : piece;
      articlesUsed++;

      if (getWordCount(accumulatedText) >= TARGET_WORD_COUNT) {
        break;
      }
    }

    // If database content is too sparse, supplement with a random fallback passage
    if (getWordCount(accumulatedText) < 160) {
      const fallback = getRandomFallbackPassage();
      accumulatedText = accumulatedText
        ? `${accumulatedText} ${fallback.text}`
        : fallback.text;
    }

    // Cleanly slice around TARGET_WORD_COUNT at a sentence boundary
    const words = accumulatedText.split(/\s+/).filter(Boolean);
    if (words.length > TARGET_WORD_COUNT + 25) {
      const candidateSlice = words.slice(0, TARGET_WORD_COUNT + 10).join(' ');
      const lastPeriodIndex = candidateSlice.lastIndexOf('.');
      if (lastPeriodIndex > 200) {
        accumulatedText = candidateSlice.substring(0, lastPeriodIndex + 1);
      } else {
        accumulatedText = candidateSlice + '.';
      }
    } else {
      accumulatedText = words.join(' ');
    }

    const finalWordCount = getWordCount(accumulatedText);
    return {
      text: accumulatedText,
      wordCount: finalWordCount,
      characterCount: accumulatedText.length,
      sourceArticlesCount: articlesUsed,
    };
  } catch (err) {
    console.error('Error generating typing passage:', err);
    return getRandomFallbackPassage();
  }
}

function getRandomFallbackPassage() {
  const chosenIndex = Math.floor(Math.random() * DIVERSE_SSC_DEST_PASSAGES.length);
  const chosen = DIVERSE_SSC_DEST_PASSAGES[chosenIndex];
  return {
    text: chosen,
    wordCount: getWordCount(chosen),
    characterCount: chosen.length,
    sourceArticlesCount: 1,
  };
}
