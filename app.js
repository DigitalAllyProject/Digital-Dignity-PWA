/*
 * Main logic for the Data Broker Opt‑Out Helper.
 * Fetches opt‑out data from GitHub, parses it, displays a searchable list,
 * and generates email/letter templates based on user input.
 */

// Translation dictionary
const translations = {
  en: {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    profileLink: 'Profile link (if required)',
    address: 'Mailing address (for letters)',
    footerThanks: 'This project is maintained by the Digital Ally Project.',
    searchPlaceholder: 'Search brokers…',
    intro: 'Below is a list of data brokers. Select a broker to view opt‑out instructions and generate a request.',
    generateEmail: 'Generate Email',
    generateLetter: 'Generate Letter',
    copy: 'Copy',
    openMail: 'Open in Mail App'
    , digitalJourney: 'Digital Journey'
    , previous: 'Previous'
    , next: 'Next'
    , addStep: 'Add Step'
    , enterDetails: 'Enter your details'
    , generatedEmail: 'Generated Email'
    , generatedLetter: 'Generated Letter'
    , generatedText: 'Generated Text'
    , helpTitle: 'How to Use This App'
    , helpIntro: 'This app helps you opt out of data broker and marketing sites and guides you through each step in a clear, accessible way.'
    , helpList1: 'Browse categories and select a broker or resource to see detailed instructions.'
    , helpList2: 'For People Search sites, you can fill out the form with your details, generate an email or letter, and follow the digital journey steps.'
    , helpList3: 'For other categories, simply read the informational text and follow any provided links or phone numbers.'
    , helpList4: 'You can reorder steps in the digital journey by dragging and dropping them.'
    , symbolTitle: 'Symbol meanings'
    , symbolHeaderSymbol: 'Symbol'
    , symbolHeaderMeaning: 'Meaning'
    , symbolCrucial: 'crucial'
    , symbolHigh: 'high priority'
    , symbolLicense: 'requires driver’s license (cross out your ID #!)'
    , symbolPhone: 'must pick up a (gasp!) phone'
    , symbolCharges: 'site charges money for access or removal'
    , helpLanguageNote: 'Use the language selector to switch between English and Spanish. If you generate an email or letter in Spanish, the app will translate it back to English when you send or print.'
  },
  es: {
    name: 'Nombre',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    profileLink: 'Enlace al perfil (si es necesario)',
    address: 'Dirección postal (para cartas)',
    footerThanks: 'Este proyecto está mantenido por el Proyecto Digital Ally.',
    searchPlaceholder: 'Buscar corredores de datos…',
    intro: 'A continuación se muestra una lista de corredores de datos. Seleccione uno para ver las instrucciones de exclusión y generar una solicitud.',
    generateEmail: 'Generar correo',
    generateLetter: 'Generar carta',
    copy: 'Copiar',
    openMail: 'Abrir en la aplicación de correo'
    , digitalJourney: 'Recorrido digital'
    , previous: 'Anterior'
    , next: 'Siguiente'
    , addStep: 'Agregar paso'
    , enterDetails: 'Introduzca sus datos'
    , generatedEmail: 'Correo generado'
    , generatedLetter: 'Carta generada'
    , generatedText: 'Texto generado'
    , helpTitle: 'Cómo usar esta aplicación'
    , helpIntro: 'Esta aplicación le ayuda a excluirse de corredores de datos y sitios de marketing y lo guía paso a paso de manera clara y accesible.'
    , helpList1: 'Explore las categorías y seleccione un corredor o recurso para ver instrucciones detalladas.'
    , helpList2: 'Para sitios de búsqueda de personas, puede completar el formulario con sus datos, generar un correo o carta y seguir los pasos del recorrido digital.'
    , helpList3: 'Para otras categorías, simplemente lea el texto informativo y siga los enlaces o números de teléfono proporcionados.'
    , helpList4: 'Puede reordenar los pasos del recorrido digital arrastrándolos y soltándolos.'
    , symbolTitle: 'Significado de los símbolos'
    , symbolHeaderSymbol: 'Símbolo'
    , symbolHeaderMeaning: 'Significado'
    , symbolCrucial: 'crucial'
    , symbolHigh: 'alta prioridad'
    , symbolLicense: 'requiere licencia de conducir (tache su ID!)'
    , symbolPhone: 'hay que levantar el teléfono'
    , symbolCharges: 'el sitio cobra dinero por acceso o eliminación'
    , helpLanguageNote: 'Use el selector de idioma para cambiar entre inglés y español. Si genera un correo o carta en español, la aplicación lo traducirá al inglés cuando lo envíe o imprima.'
  }
};

let currentLanguage = 'en';
let categories = [];
let brokers = [];
let selectedBroker = null;

// For drag and drop reordering of journey steps
let dragStartIndex = null;

// Variables to store generated content for translation and action
let generatedEmailEn = '';
let generatedLetterEn = '';
let generatedSubject = '';
let generatedTo = '';
let generatedMode = ''; // 'email' or 'letter'

/*
 * Custom broker definitions for People Search Sites.
 * Each entry provides minimal instructions in English and Spanish,
 * contact emails/phones/links, and predefined digital journey steps for both languages.
 */
const customBrokers = {
  'BeenVerified': {
    instructions: {
      en: 'Search for your listing on BeenVerified’s opt‑out page, enter your name and state, and submit your opt‑out request with a valid email. Confirm via the link sent to your email and wait for final confirmation.',
      es: 'Busque su registro en la página de exclusión de BeenVerified, ingrese su nombre y estado y envíe su solicitud de exclusión con un correo válido. Confirme a través del enlace enviado a su correo electrónico y espere la confirmación final.'
    },
    emails: [],
    phones: [],
    links: ['https://www.beenverified.com/app/optout/search'],
    journey: {
      en: [
        'Visit BeenVerified’s opt‑out page at https://www.beenverified.com/app/optout/search.',
        'Enter your name and state, then search for your listing.',
        'Select your listing and click “Proceed to Opt Out.”',
        'Enter your email address, complete the CAPTCHA and submit the request.',
        'Open the verification email and confirm your opt‑out.',
        'Wait for final confirmation that your information has been removed.'
      ],
      es: [
        'Visite la página de exclusión de BeenVerified en https://www.beenverified.com/app/optout/search.',
        'Ingrese su nombre y estado, luego busque su registro.',
        'Seleccione su registro y haga clic en “Proceed to Opt Out”.',
        'Ingrese su correo electrónico, complete el CAPTCHA y envíe la solicitud.',
        'Abra el correo de verificación y confirme su exclusión.',
        'Espere la confirmación final de que su información ha sido eliminada.'
      ]
    }
  },
  'CheckPeople': {
    instructions: {
      en: 'Go to CheckPeople’s opt‑out page, complete the form with your details, search for your listing and click “Opt Out.” Enter your email to receive a confirmation link and complete the removal.',
      es: 'Vaya a la página de exclusión de CheckPeople, complete el formulario con sus datos, busque su registro y haga clic en “Opt Out”. Ingrese su correo para recibir un enlace de confirmación y complete la eliminación.'
    },
    emails: [],
    phones: [],
    links: ['https://www.checkpeople.com/opt-out'],
    journey: {
      en: [
        'Go to https://www.checkpeople.com/opt-out.',
        'Fill out the opt‑out form with your name and state; complete the CAPTCHA; click “Search.”',
        'Locate your listing and click “Opt‑Out.”',
        'Enter your email address, complete the CAPTCHA and send the confirmation email.',
        'Open the confirmation link sent to your email and finish the removal request.',
        'Wait 5–7 days for confirmation that your information has been removed.'
      ],
      es: [
        'Vaya a https://www.checkpeople.com/opt-out.',
        'Complete el formulario de exclusión con su nombre y estado; complete el CAPTCHA; haga clic en “Search”.',
        'Ubique su registro y haga clic en “Opt‑Out”.',
        'Ingrese su correo electrónico, complete el CAPTCHA y envíe el correo de confirmación.',
        'Abra el enlace de confirmación enviado a su correo y finalice la solicitud de eliminación.',
        'Espere de 5 a 7 días para la confirmación de que su información ha sido eliminada.'
      ]
    }
  },
  'ClustrMaps': {
    instructions: {
      en: 'Visit the ClustrMaps opt‑out page, search for your address, and follow the prompts to remove your listing.',
      es: 'Visite la página de exclusión de ClustrMaps, busque su dirección y siga las indicaciones para eliminar su registro.'
    },
    emails: [],
    phones: [],
    links: ['https://clustrmaps.com/opt-out'],
    journey: {
      en: [
        'Visit https://clustrmaps.com/opt-out.',
        'Search for your address or listing.',
        'Submit the removal request and follow any prompts.',
        'Check your email for confirmation.'
      ],
      es: [
        'Visite https://clustrmaps.com/opt-out.',
        'Busque su dirección o registro.',
        'Envíe la solicitud de eliminación y siga las indicaciones.',
        'Revise su correo para confirmación.'
      ]
    }
  },
  'Dataveria': {
    instructions: {
      en: 'Find your profile on Dataveria, use the opt‑out form to request removal, and if it fails, email support@federal‑data.com with a screenshot of your listing.',
      es: 'Encuentre su perfil en Dataveria, use el formulario de exclusión para solicitar la eliminación y, si falla, envíe un correo a support@federal-data.com con una captura de pantalla de su registro.'
    },
    emails: ['support@federal-data.com'],
    phones: [],
    links: [],
    journey: {
      en: [
        'Search for your profile on Dataveria.',
        'Copy your profile URL and submit it through the opt‑out form.',
        'If the form doesn’t work, email support@federal-data.com with your profile URL and a screenshot.',
        'Wait for confirmation of removal.'
      ],
      es: [
        'Busque su perfil en Dataveria.',
        'Copie la URL de su perfil y envíela a través del formulario de exclusión.',
        'Si el formulario no funciona, envíe un correo a support@federal-data.com con la URL de su perfil y una captura de pantalla.',
        'Espere la confirmación de la eliminación.'
      ]
    }
  },
  'Intelius': {
    instructions: {
      en: 'Search for your listing on Intelius and submit an opt‑out request via their form. If you have issues, call 888‑445‑2727 or email help@intelius.com for assistance.',
      es: 'Busque su registro en Intelius y envíe una solicitud de exclusión a través de su formulario. Si tiene problemas, llame al 888-445-2727 o envíe un correo a help@intelius.com para obtener ayuda.'
    },
    emails: ['help@intelius.com'],
    phones: ['888-445-2727'],
    links: [],
    journey: {
      en: [
        'Navigate to Intelius’s opt‑out page.',
        'Search for your listing using your name and state.',
        'Select your listing and submit the opt‑out form with your email.',
        'Check your email for confirmation and complete the process.',
        'If you need assistance, call 888‑445‑2727 or email help@intelius.com.'
      ],
      es: [
        'Vaya a la página de exclusión de Intelius.',
        'Busque su registro usando su nombre y estado.',
        'Seleccione su registro y envíe el formulario de exclusión con su correo.',
        'Revise su correo para confirmación y complete el proceso.',
        'Si necesita ayuda, llame al 888-445-2727 o envíe un correo a help@intelius.com.'
      ]
    }
  },
  'MyLife': {
    instructions: {
      en: 'Locate your profile on MyLife, then use their removal form (CCPA portal) with your profile link. If necessary, email privacy@mylife.com or call 888‑704‑1900.',
      es: 'Localice su perfil en MyLife y luego use su formulario de eliminación (portal CCPA) con el enlace de su perfil. Si es necesario, envíe un correo a privacy@mylife.com o llame al 888-704-1900.'
    },
    emails: ['privacy@mylife.com'],
    phones: ['888-704-1900'],
    links: [],
    journey: {
      en: [
        'Search for your profile on MyLife and copy the URL.',
        'Use MyLife’s removal form (CCPA portal) to submit your information with the profile link.',
        'Check your email and follow any instructions to confirm your request.',
        'If not processed, email privacy@mylife.com or call 888‑704‑1900 with your profile link.'
      ],
      es: [
        'Busque su perfil en MyLife y copie la URL.',
        'Use el formulario de eliminación de MyLife (portal CCPA) para enviar su información con el enlace de su perfil.',
        'Revise su correo y siga las instrucciones para confirmar su solicitud.',
        'Si no se procesa, envíe un correo a privacy@mylife.com o llame al 888-704-1900 con el enlace de su perfil.'
      ]
    }
  },
  'Nuwber': {
    instructions: {
      en: 'Use Nuwber’s opt‑out page to search for your record (filter by state), submit the removal form with your email and profile link, and confirm via the email. If it doesn’t work, email support@nuwber.com.',
      es: 'Use la página de exclusión de Nuwber para buscar su registro (filtre por estado), envíe el formulario de eliminación con su correo y enlace de perfil, y confirme a través del correo. Si no funciona, envíe un correo a support@nuwber.com.'
    },
    emails: ['support@nuwber.com'],
    phones: [],
    links: [],
    journey: {
      en: [
        'Go to Nuwber’s removal page.',
        'Search for your record and use filters such as state to narrow the results.',
        'Copy your profile URL and submit the removal form with your email; complete the CAPTCHA.',
        'Check your email and confirm the removal.',
        'If it doesn’t work, email support@nuwber.com with your details.'
      ],
      es: [
        'Vaya a la página de eliminación de Nuwber.',
        'Busque su registro y use filtros como el estado para reducir los resultados.',
        'Copie la URL de su perfil y envíe el formulario de eliminación con su correo; complete el CAPTCHA.',
        'Revise su correo y confirme la eliminación.',
        'Si no funciona, envíe un correo a support@nuwber.com con sus datos.'
      ]
    }
  },
  'PublicDataUSA': {
    instructions: {
      en: 'Search for your information on PublicDataUSA, copy the page URL, and request removal via their “Remove my info” link or contact form.',
      es: 'Busque su información en PublicDataUSA, copie la URL de la página y solicite la eliminación a través de su enlace “Remove my info” o formulario de contacto.'
    },
    emails: [],
    phones: [],
    links: [],
    journey: {
      en: [
        'Visit PublicDataUSA and search for your information.',
        'Copy the URL of your listing.',
        'Click “Remove my info” or find the removal form and submit your details.',
        'Wait for confirmation.'
      ],
      es: [
        'Visite PublicDataUSA y busque su información.',
        'Copie la URL de su registro.',
        'Haga clic en “Remove my info” o encuentre el formulario de eliminación y envíe sus datos.',
        'Espere la confirmación.'
      ]
    }
  },
  'Radaris': {
    instructions: {
      en: 'Find your profile on Radaris, click “Control this profile” and choose “Remove info”, follow the prompts, and confirm by email. If needed, email privacy@radaris.com with your profile URL.',
      es: 'Encuentre su perfil en Radaris, haga clic en “Control this profile” y elija “Remove info”, siga las instrucciones y confirme por correo electrónico. Si es necesario, envíe un correo a privacy@radaris.com con la URL de su perfil.'
    },
    emails: ['privacy@radaris.com'],
    phones: [],
    links: [],
    journey: {
      en: [
        'Search for your profile on Radaris and open it.',
        'Click “Control this profile” then choose “Remove info”.',
        'Fill out the removal form with your email and follow the prompts.',
        'Confirm the request via the email you receive.',
        'If issues persist, email privacy@radaris.com with your profile URL.'
      ],
      es: [
        'Busque su perfil en Radaris y ábralo.',
        'Haga clic en “Control this profile” y luego elija “Remove info”.',
        'Complete el formulario de eliminación con su correo y siga las instrucciones.',
        'Confirme la solicitud mediante el correo que reciba.',
        'Si persisten problemas, envíe un correo a privacy@radaris.com con la URL de su perfil.'
      ]
    }
  },
  'SmartBackgroundChecks': {
    instructions: {
      en: 'Search for your listing on SmartBackgroundChecks, select it, and use the removal option. Confirm via the email sent.',
      es: 'Busque su registro en SmartBackgroundChecks, selecciónelo y use la opción de eliminación. Confirme a través del correo enviado.'
    },
    emails: [],
    phones: [],
    links: [],
    journey: {
      en: [
        'Go to SmartBackgroundChecks and search for your information.',
        'Select your listing and click the opt‑out option.',
        'Provide your email and submit.',
        'Confirm the removal via the email you receive.'
      ],
      es: [
        'Vaya a SmartBackgroundChecks y busque su información.',
        'Seleccione su registro y haga clic en la opción de exclusión.',
        'Proporcione su correo y envíe.',
        'Confirme la eliminación a través del correo que reciba.'
      ]
    }
  },
  'Spokeo': {
    instructions: {
      en: 'Search for your listing on Spokeo, copy the profile URL, then go to Spokeo’s opt‑out form, paste the URL, enter your email and complete the CAPTCHA. Confirm via the link in the email; note that paid accounts may still access your info.',
      es: 'Busque su registro en Spokeo, copie la URL del perfil, luego vaya al formulario de exclusión de Spokeo, pegue la URL, ingrese su correo y complete el CAPTCHA. Confirme a través del enlace en el correo; tenga en cuenta que las cuentas de pago aún pueden acceder a su información.'
    },
    emails: [],
    phones: [],
    links: ['https://www.spokeo.com/opt_out'],
    journey: {
      en: [
        'Search for your listing on Spokeo and copy the profile URL.',
        'Go to https://www.spokeo.com/opt_out.',
        'Paste the profile URL, enter your email and complete the CAPTCHA.',
        'Check your email and click the confirmation link.',
        'Be aware that paid subscribers may still access your information.'
      ],
      es: [
        'Busque su registro en Spokeo y copie la URL del perfil.',
        'Vaya a https://www.spokeo.com/opt_out.',
        'Pegue la URL del perfil, ingrese su correo y complete el CAPTCHA.',
        'Revise su correo y haga clic en el enlace de confirmación.',
        'Tenga en cuenta que los suscriptores de pago pueden seguir accediendo a su información.'
      ]
    }
  },
  'That’s Them': {
    instructions: {
      en: 'Search for your listing on That’s Them and use the removal link (not the Spokeo link) to submit your request.',
      es: 'Busque su registro en That’s Them y use el enlace de eliminación (no el enlace de Spokeo) para enviar su solicitud.'
    },
    emails: [],
    phones: [],
    links: [],
    journey: {
      en: [
        'Search for your listing on That’s Them.',
        'Click the removal link (avoid the Spokeo link) to submit your request.',
        'Follow any prompts and confirm via email if required.'
      ],
      es: [
        'Busque su registro en That’s Them.',
        'Haga clic en el enlace de eliminación (evite el enlace de Spokeo) para enviar su solicitud.',
        'Siga las indicaciones y confirme por correo si es necesario.'
      ]
    }
  },
  'Whitepages': {
    instructions: {
      en: 'Find your listing on WhitePages, use the removal or suppression request and follow the phone verification steps; you may have to call to confirm. Check 411.com to ensure your record is also removed.',
      es: 'Encuentre su registro en WhitePages, use la solicitud de supresión y siga los pasos de verificación telefónica; es posible que deba llamar para confirmar. Verifique 411.com para asegurarse de que su registro también se elimine.'
    },
    emails: [],
    phones: ['800-592-7153', '888-368-4484'],
    links: [],
    journey: {
      en: [
        'Go to WhitePages and search for your listing; copy the listing URL.',
        'Click the removal or suppression request link and follow the instructions.',
        'You may need to verify your identity via a phone call; be prepared to provide your phone number.',
        'Check 411.com for your information and request removal there if needed.'
      ],
      es: [
        'Vaya a WhitePages y busque su registro; copie la URL del registro.',
        'Haga clic en el enlace de eliminación o supresión y siga las instrucciones.',
        'Es posible que deba verificar su identidad mediante una llamada telefónica; esté preparado para proporcionar su número.',
        'Verifique 411.com para ver su información y solicite su eliminación allí si es necesario.'
      ]
    }
  }
};

// DOM elements
const introTextEl = document.getElementById('intro-text');
const brokerListEl = document.getElementById('broker-list');
const searchInputEl = document.getElementById('search-input');
const langSelectEl = document.getElementById('lang-select');
const modalEl = document.getElementById('broker-modal');
const modalCloseEl = document.getElementById('modal-close');
const brokerNameEl = document.getElementById('broker-name');
const brokerInstructionsEl = document.getElementById('broker-instructions');
const outputContainerEl = document.getElementById('output-container');
const outputTitleEl = document.getElementById('output-title');
const outputTextEl = document.getElementById('output-text');
const copyOutputBtn = document.getElementById('copy-output');
const mailtoLinkEl = document.getElementById('mailto-link');
const generateEmailBtn = document.getElementById('generate-email');
const generateLetterBtn = document.getElementById('generate-letter');

// Utility: sanitize and convert markdown links to inline text
function sanitizeInstructions(md) {
  // Replace Markdown links [text](url) with text (url)
  let text = md.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');
  // Remove emphasis (*, _, backticks)
  text = text.replace(/[*_`]/g, '');
  // Convert angle-bracket emails <email@domain> to email@domain
  text = text.replace(/<([^>]+)>/g, '$1');
  return text.trim();
}

// Convert plain text containing URLs, emails and phone numbers into clickable HTML
function linkifyText(text) {
  if (!text) return '';
  let html = text;
  // Convert URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  html = html.replace(urlRegex, (match) => {
    return `<a href="${match}" target="_blank">${match}</a>`;
  });
  // Convert email addresses
  const emailRegex = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
  html = html.replace(emailRegex, (match) => {
    return `<a href="mailto:${match}">${match}</a>`;
  });
  // Convert phone numbers like 1 (800) 349-9960 or 888-397‑3742; capture digits
  const phoneRegex = /(\d[\d\s\-()]{6,}\d)/g;
  html = html.replace(phoneRegex, (match) => {
    // Remove non-digit characters to create tel link
    const tel = match.replace(/[^\d+]/g, '');
    return `<a href="tel:${tel}">${match}</a>`;
  });
  // Replace newlines with <br>
  html = html.replace(/\n/g, '<br/>');
  return html;
}

// Helper to remove emoji characters from a string
function removeEmojis(str) {
  try {
    return str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  } catch (e) {
    // If Unicode property escapes are not supported, simply return the original string.
    return str;
  }
}

// Improved translation function: translate segments outside parentheses (which often contain URLs) to Spanish
function translateInstructionSegmentsToSpanish(text) {
  // Split text at parentheses containing any content; translate only outside segments
  const parts = [];
  let lastIndex = 0;
  const regex = /\([^\)]*\)/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const segment = text.slice(lastIndex, m.index);
    parts.push({ text: segment, translate: true });
    parts.push({ text: m[0], translate: false });
    lastIndex = regex.lastIndex;
  }
  parts.push({ text: text.slice(lastIndex), translate: true });
  // Translate segments
  return parts.map(part => {
    if (part.translate) {
      return translateInstructionsToSpanish(part.text);
    }
    return part.text;
  }).join('');
}

// Translate a given Spanish text into English using LibreTranslate API.
// Returns translated text on success, or null on failure.
async function translateToEnglish(text) {
  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'es', target: 'en', format: 'text' })
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.translatedText) {
      return data.translatedText;
    }
    return null;
  } catch (e) {
    console.warn('Translation failed:', e);
    return null;
  }
}

// Parse the raw README into categories and broker objects
function parseReadme(readme) {
  const categories = [];
  const catRegex = /^\s*##\s+(.+)$/gm;
  const cats = [];
  let match;
  while ((match = catRegex.exec(readme)) !== null) {
    cats.push({ index: match.index, name: match[1].trim() });
  }
  for (let i = 0; i < cats.length; i++) {
    const start = cats[i].index + (readme.slice(cats[i].index).match(/^\s*##\s+.+\n/)[0] || '').length;
    const end = (i + 1 < cats.length) ? cats[i + 1].index : readme.length;
    const name = cats[i].name;
    const section = readme.slice(start, end);
    // Determine informational text before any ### headings
    let info = '';
    const headingMatch = section.match(/^\s*###\s+/m);
    if (headingMatch) {
      const idx = section.indexOf(headingMatch[0]);
      info = section.slice(0, idx).trim();
    } else {
      info = section.trim();
    }
    const brokers = parseBrokers(section);
    categories.push({ name, info, brokers });
  }
  return categories;
}

// Parse brokers within a category section
function parseBrokers(section) {
  const brokerList = [];
  const headingRegex = /^\s*###\s+(.+)$/gm;
  let match;
  const indices = [];
  while ((match = headingRegex.exec(section)) !== null) {
    indices.push({ index: match.index, name: match[1].trim() });
  }
  for (let i = 0; i < indices.length; i++) {
    const headerMatch = section.slice(indices[i].index).match(/^\s*###\s+.+\n/);
    const offset = headerMatch ? headerMatch[0].length : 0;
    const start = indices[i].index + offset;
    const end = (i + 1 < indices.length) ? indices[i + 1].index : section.length;
    const name = indices[i].name;
    const instructionsRaw = section.slice(start, end).trim();
    // Extract emails
    const emailMatches = [];
    const emailRegex = /<([^>]+@[^>]+)>/g;
    let em;
    while ((em = emailRegex.exec(instructionsRaw)) !== null) {
      emailMatches.push(em[1]);
    }
    // Extract phone numbers
    const phoneMatches = [];
    const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b/g;
    let ph;
    while ((ph = phoneRegex.exec(instructionsRaw)) !== null) {
      phoneMatches.push(ph[0]);
    }
    // Extract URLs
    const urlMatches = [];
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    let urlm;
    while ((urlm = urlRegex.exec(instructionsRaw)) !== null) {
      urlMatches.push(urlm[1]);
    }
    const instructions = sanitizeInstructions(instructionsRaw);
    brokerList.push({ name, instructions, emails: emailMatches, phones: phoneMatches, links: urlMatches });
  }
  return brokerList;
}

// Fetch README from GitHub
async function loadBrokerData() {
  const url = 'https://raw.githubusercontent.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List/master/README.md';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const text = await response.text();
    const parsed = parseReadme(text);
    // Override People Search Sites with custom definitions
    parsed.forEach(cat => {
      const isPeople = cat.name.toLowerCase().includes('people search');
      cat.brokers = cat.brokers.map(b => {
        // Attempt to match broker name to a key in customBrokers (case-insensitive, partial match)
        let matchedKey = null;
        for (const key of Object.keys(customBrokers)) {
          if (b.name.toLowerCase().includes(key.toLowerCase())) {
            matchedKey = key;
            break;
          }
        }
        if (matchedKey) {
          const custom = customBrokers[matchedKey];
          return {
            name: b.name,
            instructions: custom.instructions.en,
            instructionsEs: custom.instructions.es,
            emails: custom.emails,
            phones: custom.phones,
            links: custom.links,
            journey: custom.journey,
            peopleSearch: true
          };
        }
        // For brokers under People Search, mark as peopleSearch even if no custom match
        return { ...b, peopleSearch: isPeople };
      });
      // If no brokers but info exists, leave info as is; PeopleSearch property is not needed
    });
    return parsed;
  } catch (err) {
    console.warn('Failed to fetch live data, falling back to sample.', err);
    // Fallback: minimal sample dataset for offline or when GitHub is inaccessible
    // Use a fallback dataset that mirrors the People Search custom definitions to ensure
    // Spanish instructions and journeys are available when the live README cannot be fetched.
    return [
      {
        name: 'People Search Sites',
        info: '',
        brokers: Object.keys(customBrokers).map(key => {
          const custom = customBrokers[key];
          return {
            name: key,
            instructions: custom.instructions.en,
            instructionsEs: custom.instructions.es,
            emails: custom.emails,
            phones: custom.phones,
            links: custom.links,
            journey: custom.journey,
            peopleSearch: true
          };
        })
      }
    ];
  }
}

// Render categories and brokers
function renderCategories(categoriesData) {
  const container = document.getElementById('category-list');
  container.innerHTML = '';
  categoriesData.forEach(cat => {
    const li = document.createElement('li');
    li.className = 'category-item';
    const header = document.createElement('div');
    header.className = 'category-header';
    header.textContent = cat.name;
    const toggleIcon = document.createElement('span');
    toggleIcon.textContent = '+';
    header.appendChild(toggleIcon);
    // Create informational div if any
    let infoDiv = null;
    if (cat.info && cat.info.trim().length > 0) {
      infoDiv = document.createElement('div');
      infoDiv.className = 'category-info';
      infoDiv.innerHTML = linkifyText(sanitizeInstructions(cat.info));
      // Hide initially
      infoDiv.style.display = 'none';
    }
    const listEl = document.createElement('ul');
    listEl.className = 'category-brokers';
    cat.brokers.forEach(broker => {
      const brokerLi = document.createElement('li');
      brokerLi.textContent = broker.name;
      // Add completed marker if journey completed
      const journeyMap = loadDigitalJourneys();
      const j = journeyMap[broker.name];
      if (j && j.completed) {
        brokerLi.classList.add('completed-broker');
      }
      brokerLi.addEventListener('click', e => {
        e.stopPropagation();
        openBrokerModal(broker);
      });
      listEl.appendChild(brokerLi);
    });
    header.addEventListener('click', () => {
      const visible = listEl.classList.toggle('visible');
      toggleIcon.textContent = visible ? '-' : '+';
      if (infoDiv) {
        infoDiv.style.display = visible ? 'block' : 'none';
      }
    });
    li.appendChild(header);
    if (infoDiv) {
      li.appendChild(infoDiv);
    }
    li.appendChild(listEl);
    container.appendChild(li);
  });
}

// Update UI texts according to selected language
function updateLanguageTexts() {
  const t = translations[currentLanguage];
  // Update placeholders
  searchInputEl.placeholder = t.searchPlaceholder;
  introTextEl.textContent = t.intro;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });
  // Update action buttons
  generateEmailBtn.textContent = t.generateEmail;
  generateLetterBtn.textContent = t.generateLetter;
  copyOutputBtn.textContent = t.copy;
  mailtoLinkEl.textContent = t.openMail;
  // Update footer text
  document.querySelector('footer span[data-i18n="footerThanks"]').textContent = t.footerThanks;
  // Update add step placeholder and button text
  const newStepInput = document.getElementById('new-step');
  if (newStepInput) {
    if (currentLanguage === 'es') {
      newStepInput.placeholder = 'Agregue su propio paso';
    } else {
      newStepInput.placeholder = 'Add your own step';
    }
  }
  // Update output action button label based on generated mode and language
  const actionBtn = document.getElementById('action-button');
  if (actionBtn && !outputContainerEl.classList.contains('hidden')) {
    if (generatedMode === 'email') {
      actionBtn.textContent = currentLanguage === 'es' ? 'Abrir correo' : 'Open Email';
    } else if (generatedMode === 'letter') {
      actionBtn.textContent = currentLanguage === 'es' ? 'Imprimir / Guardar PDF' : 'Print / Save PDF';
    }
  }
}

// Open modal for selected broker
function openBrokerModal(broker) {
  selectedBroker = broker;
  // Sanitize broker name to remove emojis
  const sanitizedName = removeEmojis(broker.name);
  brokerNameEl.textContent = sanitizedName;
  // Show instructions in selected language. Use predefined Spanish if available, otherwise translate (with improved logic).
  let instructions = broker.instructions;
  if (currentLanguage === 'es') {
    if (broker.instructionsEs) {
      instructions = broker.instructionsEs;
    } else {
      instructions = translateInstructionSegmentsToSpanish(instructions);
    }
  }
  // Display instructions with clickable links and emails
  brokerInstructionsEl.innerHTML = linkifyText(instructions);
  // Reset user inputs
  const formEl = document.getElementById('user-input-form');
  formEl.reset();
  outputContainerEl.classList.add('hidden');
  // Show or hide form and journey depending on category
  const journeyContainer = document.getElementById('journey-container');
  const actionsContainer = document.querySelector('.actions');
  if (broker.peopleSearch) {
    formEl.style.display = '';
    actionsContainer.style.display = '';
    journeyContainer.style.display = '';
    // Load or generate journey
    loadOrGenerateJourney(broker);
  } else {
    // Hide user form and actions for non‑people categories
    formEl.style.display = 'none';
    actionsContainer.style.display = 'none';
    journeyContainer.style.display = 'none';
  }
  modalEl.classList.remove('hidden');
}

// Close modal
function closeModal() {
  modalEl.classList.add('hidden');
  selectedBroker = null;
}

// Generate email body
function generateEmail() {
  if (!selectedBroker) return;
  const name = document.getElementById('input-name').value.trim();
  const email = document.getElementById('input-email').value.trim();
  const phone = document.getElementById('input-phone').value.trim();
  const link = document.getElementById('input-link').value.trim();
  const address = document.getElementById('input-address').value.trim();
  if (!name || !email) {
    alert('Please enter your name and email.');
    return;
  }
  // Determine sanitized broker name (for subject) and recipient email
  const sanitizedName = removeEmojis(selectedBroker.name);
  const to = selectedBroker.emails && selectedBroker.emails.length ? selectedBroker.emails[0] : '';
  const subject = `Request to remove personal information from ${sanitizedName}`;
  // Compose English body
  let bodyEn = '';
  bodyEn += `Hello ${sanitizedName} team,\n\n`;
  bodyEn += `I am writing to request the removal of my personal information from your databases. `;
  bodyEn += `My details are as follows:\n`;
  bodyEn += `Name: ${name}\n`;
  bodyEn += `Email: ${email}\n`;
  if (phone) bodyEn += `Phone: ${phone}\n`;
  if (address) bodyEn += `Address: ${address}\n`;
  if (link) bodyEn += `Profile URL: ${link}\n`;
  bodyEn += `\nI have submitted an opt‑out request via your website. Please remove my information and provide written confirmation once the removal is complete.\n\n`;
  bodyEn += `Thank you for your prompt attention to this matter.\n\nSincerely,\n${name}`;
  // Compose Spanish body
  let bodyEs = '';
  bodyEs += `Hola equipo de ${sanitizedName},\n\n`;
  bodyEs += `Les escribo para solicitar la eliminación de mi información personal de sus bases de datos. `;
  bodyEs += `Mis datos son los siguientes:\n`;
  bodyEs += `Nombre: ${name}\n`;
  bodyEs += `Correo electrónico: ${email}\n`;
  if (phone) bodyEs += `Teléfono: ${phone}\n`;
  if (address) bodyEs += `Dirección: ${address}\n`;
  if (link) bodyEs += `Enlace de perfil: ${link}\n`;
  bodyEs += `\nHe enviado una solicitud de exclusión a través de su sitio web. Por favor, eliminen mi información y proporcionen confirmación por escrito una vez que la eliminación esté completa.\n\n`;
  bodyEs += `Gracias por su pronta atención a este asunto.\n\nAtentamente,\n${name}`;
  const displayBody = currentLanguage === 'es' ? bodyEs : bodyEn;
  // Display output and store generated values
  outputContainerEl.classList.remove('hidden');
  outputTitleEl.textContent = translations[currentLanguage].generatedEmail;
  outputTextEl.value = displayBody;
  outputTextEl.disabled = false; // allow editing
  generatedEmailEn = bodyEn;
  generatedSubject = subject;
  generatedTo = to;
  generatedMode = 'email';
  // Setup action button for email
  const actionBtn = document.getElementById('action-button');
  actionBtn.textContent = currentLanguage === 'es' ? 'Abrir correo' : 'Open Email';
  actionBtn.onclick = async () => {
    // Get current text from textarea (possibly edited)
    const content = outputTextEl.value;
    let englishBody;
    if (currentLanguage === 'es') {
      englishBody = await translateToEnglish(content);
      if (!englishBody) englishBody = content;
    } else {
      englishBody = content;
    }
    const mailtoBody = encodeURIComponent(englishBody);
    const mailto = 'mailto:' + encodeURIComponent(generatedTo) + '?subject=' + encodeURIComponent(generatedSubject) + '&body=' + mailtoBody;
    // Use hidden anchor to open to avoid blocking translation promise
    mailtoLinkEl.href = mailto;
    mailtoLinkEl.click();
  };
}

// Generate letter body
function generateLetter() {
  if (!selectedBroker) return;
  const name = document.getElementById('input-name').value.trim();
  const email = document.getElementById('input-email').value.trim();
  const phone = document.getElementById('input-phone').value.trim();
  const link = document.getElementById('input-link').value.trim();
  const address = document.getElementById('input-address').value.trim();
  if (!name || !address) {
    alert('Please enter your name and mailing address for the letter.');
    return;
  }
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US');
  // Determine sanitized broker name
  const sanitizedName = removeEmojis(selectedBroker.name);
  // Compose English letter
  let letterEn = '';
  letterEn += `${dateStr}\n\n`;
  letterEn += `${sanitizedName}\n`;
  letterEn += `Re: Request to remove personal information\n\n`;
  letterEn += `To whom it may concern,\n\n`;
  letterEn += `I am writing to formally request the removal of my personal information from your databases.\n`;
  letterEn += `Below are my details:\n`;
  letterEn += `Name: ${name}\n`;
  letterEn += `Address: ${address}\n`;
  if (email) letterEn += `Email: ${email}\n`;
  if (phone) letterEn += `Phone: ${phone}\n`;
  if (link) letterEn += `Profile URL: ${link}\n`;
  letterEn += `\nI have submitted an opt‑out request via your website. Please remove my information and provide written confirmation once the removal is complete.\n\n`;
  letterEn += `Sincerely,\n\n${name}\n`;
  // Compose Spanish letter
  let letterEs = '';
  letterEs += `${dateStr}\n\n`;
  letterEs += `${sanitizedName}\n`;
  letterEs += `Re: Solicitud de eliminación de información personal\n\n`;
  letterEs += `A quien corresponda,\n\n`;
  letterEs += `Les escribo para solicitar formalmente la eliminación de mi información personal de sus bases de datos.\n`;
  letterEs += `Mis datos son los siguientes:\n`;
  letterEs += `Nombre: ${name}\n`;
  letterEs += `Dirección: ${address}\n`;
  if (email) letterEs += `Correo electrónico: ${email}\n`;
  if (phone) letterEs += `Teléfono: ${phone}\n`;
  if (link) letterEs += `Enlace de perfil: ${link}\n`;
  letterEs += `\nHe enviado una solicitud de exclusión a través de su sitio web. Por favor, eliminen mi información y proporcionen una confirmación por escrito una vez que la eliminación esté completa.\n\n`;
  letterEs += `Atentamente,\n\n${name}\n`;
  const displayLetter = currentLanguage === 'es' ? letterEs : letterEn;
  // Display output and store generated values
  outputContainerEl.classList.remove('hidden');
  outputTitleEl.textContent = translations[currentLanguage].generatedLetter;
  outputTextEl.value = displayLetter;
  outputTextEl.disabled = false;
  generatedLetterEn = letterEn;
  generatedMode = 'letter';
  // Setup action button for printing
  const actionBtn = document.getElementById('action-button');
  actionBtn.textContent = currentLanguage === 'es' ? 'Imprimir / Guardar PDF' : 'Print / Save PDF';
  actionBtn.onclick = async () => {
    // Get current text (possibly edited)
    const content = outputTextEl.value;
    let englishContent;
    if (currentLanguage === 'es') {
      englishContent = await translateToEnglish(content);
      if (!englishContent) englishContent = content;
    } else {
      englishContent = content;
    }
    // Create a printable window
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Print Letter</title><style>body{font-family: Arial, sans-serif; white-space: pre-wrap; margin: 1rem;} </style></head><body>');
    printWindow.document.write(englishContent.replace(/\n/g, '<br/>'));
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
}

// Copy output text to clipboard
function copyOutput() {
  outputTextEl.select();
  document.execCommand('copy');
  alert('Copied to clipboard');
}

// --- Translation for instructions ---
const instructionTranslations = {
  'Find your information': 'Busque su información',
  'opt out': 'excluirse',
  'people search': 'búsqueda de personas',
  'property search': 'búsqueda de propiedades',
  'confirm your opt-out request': 'confirme su solicitud de exclusión',
  'email': 'correo electrónico',
  'profile URL': 'URL de perfil',
  'support': 'soporte',
  'call': 'llamar',
  /* The entry for "form" has been removed to prevent unintended substitutions inside words like "information". */
  'enter the URL': 'ingrese la URL',
  'specific profile URL': 'URL de perfil específica',
  'multiple steps': 'múltiples pasos'
};

function translateInstructionsToSpanish(text) {
  let translated = text;
  // Helper to escape regex special characters
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Replace only whole phrases using word boundaries to avoid partial replacements
  Object.keys(instructionTranslations).sort((a,b) => b.length - a.length).forEach(key => {
    const pattern = `\\b${escapeRegExp(key)}\\b`;
    const regex = new RegExp(pattern, 'gi');
    translated = translated.replace(regex, instructionTranslations[key]);
  });
  return translated;
}

// --- Digital Journey management ---
function loadDigitalJourneys() {
  try {
    return JSON.parse(localStorage.getItem('digitalJourneys') || '{}');
  } catch (e) {
    return {};
  }
}

function saveDigitalJourneys(map) {
  localStorage.setItem('digitalJourneys', JSON.stringify(map));
}

function generateDigitalJourney(broker) {
  // If predefined journey exists, return its English steps.
  if (broker.journey && broker.journey.en) {
    return broker.journey.en;
  }
  const steps = [];
  const ins = (broker.instructions || '').toLowerCase();
  const firstLink = broker.links && broker.links.length ? broker.links[0] : null;
  // Step: find information
  if (ins.includes('find your information') || ins.includes('search')) {
    if (firstLink) {
      steps.push(`Go to ${firstLink} and search for your information.`);
    } else {
      steps.push('Search for your information on the website.');
    }
  }
  // Step: opt out via form
  if (ins.includes('opt out') || ins.includes('opt-out')) {
    steps.push('Open the opt‑out form and enter your details.');
  }
  // Step: email
  if (broker.emails && broker.emails.length) {
    steps.push(`Send an email to ${broker.emails[0]} requesting removal.`);
  }
  // Step: phone call
  if (broker.phones && broker.phones.length) {
    steps.push(`Call ${broker.phones[0]} and ask to remove your information.`);
  }
  // Always final step
  steps.push('Check your email for confirmation and follow any instructions.');
  return steps;
}

function loadOrGenerateJourney(broker) {
  const journeyMap = loadDigitalJourneys();
  let journey = journeyMap[broker.name];
  // Determine predefined steps for both languages if available
  const stepsEn = broker.journey && broker.journey.en ? broker.journey.en : generateDigitalJourney(broker);
  const stepsEs = broker.journey && broker.journey.es ? broker.journey.es : stepsEn.map(step => translateInstructionSegmentsToSpanish(step));
  if (!journey) {
    journey = { stepsEn: stepsEn, stepsEs: stepsEs, currentStep: 0, completed: false };
    journeyMap[broker.name] = journey;
    saveDigitalJourneys(journeyMap);
  } else {
    // If stored journey lacks steps for languages, update them but keep current progress and completion status
    let updated = false;
    if (!journey.stepsEn) { journey.stepsEn = stepsEn; updated = true; }
    if (!journey.stepsEs) { journey.stepsEs = stepsEs; updated = true; }
    if (updated) {
      journeyMap[broker.name] = journey;
      saveDigitalJourneys(journeyMap);
    }
  }
  // Render journey
  renderJourney(broker.name);
}

function renderJourney(name) {
  const journeyMap = loadDigitalJourneys();
  const journey = journeyMap[name];
  const container = document.getElementById('journey-container');
  if (!journey) {
    container.classList.add('hidden');
    return;
  }
  // Choose steps based on language
  const steps = currentLanguage === 'es' ? (journey.stepsEs || journey.stepsEn) : journey.stepsEn;
  if (!steps || steps.length === 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');
  const listEl = document.getElementById('journey-steps');
  listEl.innerHTML = '';
  steps.forEach((step, idx) => {
    const li = document.createElement('li');
    li.textContent = step;
    if (idx === journey.currentStep) {
      li.style.fontWeight = 'bold';
    }
    if (journey.completed) {
      li.style.textDecoration = 'line-through';
    }
    // Enable dragging for reordering
    li.setAttribute('draggable', true);
    li.dataset.index = idx;
    li.addEventListener('dragstart', (e) => {
      dragStartIndex = idx;
      li.classList.add('dragging');
      // Workaround for Firefox; set data
      e.dataTransfer.setData('text/plain', '');
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      const siblings = listEl.querySelectorAll('li');
      siblings.forEach(sib => sib.classList.remove('drag-over'));
    });
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    li.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (e.target.tagName === 'LI') {
        e.target.classList.add('drag-over');
      }
    });
    li.addEventListener('dragleave', (e) => {
      if (e.target.tagName === 'LI') {
        e.target.classList.remove('drag-over');
      }
    });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.target.tagName !== 'LI') return;
      const toIndex = parseInt(e.target.dataset.index, 10);
      reorderJourneySteps(name, dragStartIndex, toIndex);
    });
    listEl.appendChild(li);
  });
  // Update controls: disable prev at first step, disable next if at last or completed
  const prevBtn = document.getElementById('journey-prev');
  const nextBtn = document.getElementById('journey-next');
  // Disable previous button only at first step; allow going back even when completed
  prevBtn.disabled = (journey.currentStep === 0);
  const atLastStep = journey.currentStep >= steps.length - 1;
  // Do not disable next button at last step; clicking will mark completion
  nextBtn.disabled = journey.completed;
  // Change next button text to indicate finish if at last step and not completed
  if (!journey.completed && atLastStep) {
    nextBtn.textContent = currentLanguage === 'es' ? 'Finalizar' : 'Finish';
  } else {
    nextBtn.textContent = translations[currentLanguage].next;
  }
}

// Advance or rewind journey step
function changeJourneyStep(direction) {
  const name = selectedBroker ? selectedBroker.name : null;
  if (!name) return;
  const journeyMap = loadDigitalJourneys();
  const journey = journeyMap[name];
  if (!journey) return;
  const steps = currentLanguage === 'es' ? (journey.stepsEs || journey.stepsEn) : journey.stepsEn;
  if (journey.completed) {
    return;
  }
  if (direction === 'next') {
    if (journey.currentStep < steps.length - 1) {
      journey.currentStep++;
    } else {
      // Completed!
      journey.completed = true;
      // Show celebration overlay
      const overlay = document.getElementById('celebration-overlay');
      if (overlay) {
        overlay.classList.remove('hidden');
        // Start confetti animation
        startConfetti();
      }
      // Update checkmark for this broker (handled in renderCategories)
    }
  } else if (direction === 'prev') {
    if (journey.currentStep > 0) {
      journey.currentStep--;
    }
  }
  journeyMap[name] = journey;
  saveDigitalJourneys(journeyMap);
  renderJourney(name);
}

// Start a confetti animation inside the celebration overlay
function startConfetti() {
  const overlay = document.getElementById('celebration-overlay');
  if (!overlay) return;
  // Remove existing confetti pieces
  const existing = overlay.querySelectorAll('.confetti-piece');
  existing.forEach(el => el.remove());
  // Colors for confetti pieces
  const colors = ['#FF5E3A', '#A8E6CF', '#00C6FF', '#FF6F61', '#6A11CB'];
  const count = 60;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    piece.style.backgroundColor = color;
    // Position across the overlay width
    piece.style.left = Math.random() * 100 + '%';
    // Random animation duration and delay
    const duration = (1.5 + Math.random() * 2).toFixed(2);
    const delay = (Math.random() * 0.5).toFixed(2);
    piece.style.animationDuration = duration + 's';
    piece.style.animationDelay = delay + 's';
    overlay.appendChild(piece);
    // Remove after animation completes
    setTimeout(() => {
      piece.remove();
    }, (parseFloat(duration) + parseFloat(delay)) * 1000 + 1000);
  }
}

// Reorder journey steps when a drag-and-drop occurs
function reorderJourneySteps(brokerName, fromIndex, toIndex) {
  const journeyMap = loadDigitalJourneys();
  const journey = journeyMap[brokerName];
  if (!journey || fromIndex === toIndex) return;
  // Ensure arrays exist
  const stepsEn = journey.stepsEn || [];
  const stepsEs = journey.stepsEs || stepsEn.map(s => translateInstructionsToSpanish(s));
  // Helper to move item within array
  function moveItem(arr, from, to) {
    const item = arr.splice(from, 1)[0];
    arr.splice(to, 0, item);
  }
  moveItem(stepsEn, fromIndex, toIndex);
  moveItem(stepsEs, fromIndex, toIndex);
  // Update current step to follow moved item
  if (journey.currentStep === fromIndex) {
    journey.currentStep = toIndex;
  } else if (fromIndex < journey.currentStep && toIndex >= journey.currentStep) {
    journey.currentStep -= 1;
  } else if (fromIndex > journey.currentStep && toIndex <= journey.currentStep) {
    journey.currentStep += 1;
  }
  journey.stepsEn = stepsEn;
  journey.stepsEs = stepsEs;
  journeyMap[brokerName] = journey;
  saveDigitalJourneys(journeyMap);
  renderJourney(brokerName);
}

// Check remote repository for updated digital journeys (stub)
async function checkForUpdates() {
  const now = Date.now();
  const last = parseInt(localStorage.getItem('lastUpdateCheck') || '0', 10);
  const oneDay = 24 * 60 * 60 * 1000;
  if (now - last < oneDay) {
    return;
  }
  localStorage.setItem('lastUpdateCheck', String(now));
  try {
    const response = await fetch('https://raw.githubusercontent.com/DigitalAllyProject/Digital-Dignity-PWA/main/journeys.json');
    if (!response.ok) return;
    const remoteJourneys = await response.json();
    const localJourneys = loadDigitalJourneys();
    let updated = false;
    Object.keys(remoteJourneys).forEach(name => {
      if (!localJourneys[name]) {
        localJourneys[name] = { steps: remoteJourneys[name].steps, currentStep: 0 };
        updated = true;
      }
    });
    if (updated) {
      saveDigitalJourneys(localJourneys);
    }
  } catch (e) {
    // ignore errors silently
  }
}

// Flatten categories into brokers for search
function flattenBrokers(cats) {
  const arr = [];
  cats.forEach(cat => {
    cat.brokers.forEach(b => arr.push({ ...b, category: cat.name }));
  });
  return arr;
}

// Filter categories based on search term
function filterList() {
  const term = searchInputEl.value.toLowerCase();
  if (!term) {
    renderCategories(categories);
    return;
  }
  const filteredCats = [];
  categories.forEach(cat => {
    const matchingBrokers = cat.brokers.filter(b => b.name.toLowerCase().includes(term));
    if (matchingBrokers.length > 0) {
      filteredCats.push({ name: cat.name, brokers: matchingBrokers });
    }
  });
  renderCategories(filteredCats);
}

// Initialize application
async function init() {
  // Register service worker if supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  }
  // Load data
  categories = await loadBrokerData();
  // Flatten for search if needed
  brokers = flattenBrokers(categories);
  renderCategories(categories);
  introTextEl.textContent = translations[currentLanguage].intro;
  // Event listeners
  searchInputEl.addEventListener('input', filterList);
  langSelectEl.addEventListener('change', e => {
    currentLanguage = e.target.value;
    updateLanguageTexts();
    // Re-render journey and instructions if a broker modal is open
    if (selectedBroker) {
      // Update instructions display
      let instructions = selectedBroker.instructions;
      if (currentLanguage === 'es') {
        if (selectedBroker.instructionsEs) {
          instructions = selectedBroker.instructionsEs;
        } else {
          instructions = translateInstructionsToSpanish(instructions);
        }
      }
      brokerInstructionsEl.textContent = instructions;
      // Update journey rendering
      renderJourney(selectedBroker.name);
      // Update output titles if visible
      if (!outputContainerEl.classList.contains('hidden')) {
        // Determine if output is email or letter by checking title text
        const currentTitle = outputTitleEl.textContent.toLowerCase();
        if (currentTitle.includes('email')) {
          outputTitleEl.textContent = translations[currentLanguage].generatedEmail;
        } else if (currentTitle.includes('letter')) {
          outputTitleEl.textContent = translations[currentLanguage].generatedLetter;
        } else {
          outputTitleEl.textContent = translations[currentLanguage].generatedText;
        }
      }
    }
  });
  modalCloseEl.addEventListener('click', closeModal);
  generateEmailBtn.addEventListener('click', generateEmail);
  generateLetterBtn.addEventListener('click', generateLetter);
  copyOutputBtn.addEventListener('click', copyOutput);
  document.getElementById('journey-next').addEventListener('click', () => changeJourneyStep('next'));
  document.getElementById('journey-prev').addEventListener('click', () => changeJourneyStep('prev'));
  // Add step functionality
  const addStepBtn = document.getElementById('add-step');
  if (addStepBtn) {
    addStepBtn.addEventListener('click', () => {
      const name = selectedBroker ? selectedBroker.name : null;
      if (!name) return;
      const newStepInput = document.getElementById('new-step');
      const value = newStepInput.value.trim();
      if (!value) return;
      const journeyMap = loadDigitalJourneys();
      let journey = journeyMap[name];
      if (!journey) {
        journey = { stepsEn: [], stepsEs: [], currentStep: 0, completed: false };
      }
      // Add step to both language arrays; if Spanish text and English context differ, use the same string
      if (!journey.stepsEn) journey.stepsEn = [];
      if (!journey.stepsEs) journey.stepsEs = [];
      journey.stepsEn.push(value);
      journey.stepsEs.push(value);
      journeyMap[name] = journey;
      saveDigitalJourneys(journeyMap);
      newStepInput.value = '';
      renderJourney(name);
    });
  }
  // Close celebration overlay
  const closeCelebration = document.getElementById('close-celebration');
  if (closeCelebration) {
    closeCelebration.addEventListener('click', () => {
      const overlay = document.getElementById('celebration-overlay');
      overlay.classList.add('hidden');
      // re-render categories to show completed check
      renderCategories(categories);
    });
  }

  // Help modal events
  const helpBtn = document.getElementById('help-button');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-close');
  if (helpBtn && helpModal) {
    helpBtn.addEventListener('click', () => {
      helpModal.classList.remove('hidden');
    });
    if (helpClose) {
      helpClose.addEventListener('click', () => {
        helpModal.classList.add('hidden');
      });
    }
    // Close help modal when clicking outside the content
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.classList.add('hidden');
      }
    });
  }
  // Click outside modal content to close
  modalEl.addEventListener('click', e => {
    if (e.target === modalEl) closeModal();
  });
  // Initial language setup
  updateLanguageTexts();

  // Check for updates to digital journeys once per day
  checkForUpdates();
}

document.addEventListener('DOMContentLoaded', init);