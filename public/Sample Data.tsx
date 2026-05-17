{
  "welcome": {
    "en": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 Welcome to E-SHOP KH! I am your digital assistant, how can I help you today?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "ℹ️ General Info",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_en": "📚 Product List & Prices",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_en": "💬 Chat with Shop",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "📦 Problem/Request",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_en": "💳 Payment Method",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_en": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "kh": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 ជម្រាបសួស្តិ៍ សូមស្វាគមន៍ មកកាន់ហាង E-SHOP KH! ខ្ញុំគឺជាជំនួយការឌីជីថល, តើមានអ្វីឲ្យខ្ញុំជួយបាន?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "ℹ️ អំពីពត៍មានទូទៅ",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_kh": "📚 បញ្ជីផលិតផល និង តម្លៃ",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_kh": "💬 ឆាតជាមួយបុគ្គលិកហាង",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "📦 បញ្ញាឥវ៉ាន/ការស្នើសុំ",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_kh": "💳 ការទូទាត់",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_kh": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "metadata": {
      "created_by": "admin001",
      "is_active": true,
      "last_updated": "2025-09-24T15:46",
      "linked_pages": ["708759082319392"],
      "version": 1
    }
  }
}

{
  type: "quick-replies",
  en: [
    {
      is_active: true,
      template_type: "quick_reply",
      intro_text: "Choose an option",
      replies: [
        { label: { en: "🏠 Home" }, payload: "welcome", type: "postback" },
        { label: { en: "📚 Catalog" }, payload: "catalog", type: "postback" },
        { label: { en: "🔥 Promo" }, payload: "promoted", type: "postback" }
      ]
    }
  ],
  kh: [
    {
      is_active: true,
      template_type: "quick_reply",
      intro_text: "ជ្រើសរើសជម្រើស",
      replies: [
        { label: { kh: "🏠 ទំព័រដើម" }, payload: "welcome", type: "postback" },
        { label: { kh: "📚 ផលិតផល" }, payload: "catalog", type: "postback" },
        { label: { kh: "🔥 បញ្ចុះតម្លៃ" }, payload: "promoted", type: "postback" }
      ]
    }
  ],
  metadata: {
    created_by: "admin001",
    is_active: true,
    last_updated: "2025-09-26T06:14",
    linked_pages: ["708759082319392"],
    version: 1
  },
  condition: {
    persistent: true,
    show_if_tag: "new_user",
    hide_if_clicked: ["promo"]
  }
}



"flow_skin_care"{
  {
  "convas":{},

  "info_skin_care"{
    "kh":[text, generic],
    "kh":[not exist with default fallback],
    "metadata":{}
  }
}
}

{
  "welcome": {
    "kh": [
      {
        "template_type": "text",
        "is_active": true,
        "text": "សូមស្វាគមន៍! តើអ្នកចង់ដឹងអំពីផលិតផលថែសម្រស់?"
      },
      {
        "template_type": "generic",
        "is_active": true,
        "cards": [
          {
            "title": "ព័ត៌មានថែសម្រស់",
            "subtitle": "",
            "image_url": "",
            "layout": "hero",
            "options": [
              {
                "label_kh": "🧴 មើលព័ត៌មាន",
                "payload": "info_skin_care",
                "type": "postback"
              }
            ]
          }
        ],
        "linked_block": {
          "info_skin_care": {
            "kh": [
              {
                "template_type": "text",
                "is_active": true,
                "text": "នេះជាព័ត៌មានអំពីផលិតផលថែសម្រស់"
              },
              {
                "template_type": "generic",
                "is_active": true,
                "cards": [
                  {
                    "title": "សាប៊ូ",
                    "subtitle": "សម្រាប់ស្បែកងាយរងគ្រោះ",
                    "image_url": "https://via.placeholder.com/300x150",
                    "layout": "hero",
                    "options": [
                      {
                        "label_kh": "🛒 ទិញឥឡូវនេះ",
                        "payload": "buy_sabon",
                        "type": "postback"
                      }
                    ]
                  }
                ]
              }
            ],
            "en": [...],
            "metadata": {
              "blockType": "info",
              "name": "info_skin_care",
              "created_by": "admin001",
              "last_updated": "2025-10-16T18:48:00.000Z",
              "is_active": true
            }
          }
        }
      }
    ],
    "en": [...],
    "metadata": {
      "blockType": "info",
      "name": "welcome",
      "created_by": "admin001",
      "last_updated": "2025-10-16T18:48:00.000Z",
      "is_active": true
    }
  }
}

{
  id: "welcome",
  kh: [...],
  en: [ generic's option 1 => product_list, option 2 => product_detail]
  metadata: {...},
  linked_blocks: ["product_list", product_detail]
}

{
  id: "product_list",
  kh: [...],
  en: [...],
  metadata: {...},
  linked_blocks: [...]
}

{
  id: "product_detail",
  kh: [...],
  en: [...],
  metadata: {...},
  linked_blocks: [...]
}



📦 Flat Firebase export: {
  "welcome": {
    "kh": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "asdfasd",
            "subtitle": "asdf",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_kh": "tests",
                "payload": "skincare",
                "type": "postback"
              }
            ]
          }
        ]
      },
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "asdf",
            "subtitle": "asdfasd",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_kh": "sss",
                "payload": "ssss",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "en": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "asdfasd",
            "subtitle": "asdf",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_en": "Option 1",
                "payload": "skincare",
                "type": "postback"
              }
            ]
          }
        ]
      },
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "asdf",
            "subtitle": "asdfasd",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_en": "Option 1",
                "payload": "ssss",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "metadata": {
      "blockType": "info",
      "name": "welcome",
      "config": {},
      "linked_pages": [
        "708759082319392"
      ],
      "created_by": "admin001",
      "last_updated": "2025-10-16T18:57:30.169Z",
      "is_active": true
    },
    "linked_blocks": []
  },
  "productlist": {
    "kh": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "asdf",
            "subtitle": "asdfasd",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_kh": "sss",
                "payload": "ssss",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "en": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "asdf",
            "subtitle": "asdfasd",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_en": "Option 1",
                "payload": "ssss",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "metadata": {
      "blockType": "info",
      "name": "productlist",
      "config": {},
      "linked_pages": [
        "708759082319392"
      ],
      "created_by": "admin001",
      "last_updated": "2025-10-16T18:57:30.171Z",
      "is_active": true
    },
    "linked_blocks": []
  }
}

I thiink you should check again it should be like this right ? 
{
  id: "welcome",
  kh: [...],
  en: [ generic's payload 1 => product_list, payload 2 => product_detail]
  metadata: {...},
  linked_blocks: ["product_list", product_detail]
}

{
  id: "product_list",
  kh: [...],
  en: [...],
  metadata: {...},
  linked_blocks: [...]
}

{
  id: "product_detail",
  kh: [...],
  en: [...],
  metadata: {...},
  linked_blocks: [...]
}

you should fetch from payload 


📦 Flat Firebase export: {
  "Soap": {
    "kh": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "Natureal Soap",
            "subtitle": "Cambodia product",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_kh": "",
                "payload": "Skin Care",
                "type": "postback"
              }
            ]
          }
        ],
        "linked_block": {
          "Skin Care": {
            "kh": [
              {
                "template_type": "text",
                "is_active": true,
                "text": "How I can help your ?"
              }
            ],
            "en": [
              {
                "template_type": "text",
                "is_active": true,
                "text": "How I can help your ?"
              }
            ],
            "metadata": {
              "blockType": "info",
              "name": "Skin Care",
              "config": {},
              "linked_pages": [
                "708759082319392"
              ],
              "created_by": "admin001",
              "last_updated": "2025-10-16T20:34:46.076Z",
              "is_active": true
            },
            "linked_blocks": []
          }
        }
      },
      {
        "template_type": "text",
        "is_active": true,
        "text": "How I can help your ?"
      }
    ],
    "en": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "Natureal Soap",
            "subtitle": "Cambodia product",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_en": "Option 1",
                "payload": "Skin Care",
                "type": "postback"
              }
            ]
          }
        ],
        "linked_block": {
          "Skin Care": {
            "kh": [
              {
                "template_type": "text",
                "is_active": true,
                "text": "How I can help your ?"
              }
            ],
            "en": [
              {
                "template_type": "text",
                "is_active": true,
                "text": "How I can help your ?"
              }
            ],
            "metadata": {
              "blockType": "info",
              "name": "Skin Care",
              "config": {},
              "linked_pages": [
                "708759082319392"
              ],
              "created_by": "admin001",
              "last_updated": "2025-10-16T20:34:46.076Z",
              "is_active": true
            },
            "linked_blocks": []
          }
        }
      },
      {
        "template_type": "text",
        "is_active": true,
        "text": "How I can help your ?"
      }
    ],
    "metadata": {
      "blockType": "info",
      "name": "Soap",
      "config": {},
      "linked_pages": [
        "708759082319392"
      ],
      "created_by": "admin001",
      "last_updated": "2025-10-16T20:34:46.076Z",
      "is_active": true
    },
    "linked_blocks": [
      "Skin Care"
    ]
  },
  "Skin Care": {
    "kh": [
      {
        "template_type": "text",
        "is_active": true,
        "text": "How I can help your ?"
      }
    ],
    "en": [
      {
        "template_type": "text",
        "is_active": true,
        "text": "How I can help your ?"
      }
    ],
    "metadata": {
      "blockType": "info",
      "name": "Skin Care",
      "config": {},
      "linked_pages": [
        "708759082319392"
      ],
      "created_by": "admin001",
      "last_updated": "2025-10-16T20:34:46.076Z",
      "is_active": true
    },
    "linked_blocks": []
  }
}

📦 Flat Firebase export: {
  "skin care": {
    "kh": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "",
            "subtitle": "",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_kh": "sdfsd",
                "payload": "sdfsdf",
                "type": "postback"
              }
            ]
          }
        ]
      },
      {
        "template_type": "text",
        "is_active": true,
        "text": "asdfsadf"
      }
    ],
    "en": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "",
            "subtitle": "",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_en": "Option 1",
                "payload": "sdfsdf",
                "type": "postback"
              }
            ]
          }
        ]
      },
      {
        "template_type": "text",
        "is_active": true,
        "text": "asdfsadf"
      }
    ],
    "metadata": {
      "blockType": "info",
      "name": "skin care",
      "config": {},
      "linked_pages": [
        "708759082319392"
      ],
      "created_by": "admin001",
      "last_updated": "2025-10-17T04:02:55.486Z",
      "is_active": true
    },
    "linked_blocks": []
  },
  "GKmO2F18Tx-Ldq7HutCdV": {
    "kh": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "",
            "subtitle": "",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_kh": "sdfsd",
                "payload": "sdfsdf",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "en": [
      {
        "template_type": "generic",
        "is_active": false,
        "cards": [
          {
            "title": "",
            "subtitle": "",
            "image_url": "https://via.placeholder.com/300x150",
            "layout": "hero",
            "options": [
              {
                "label_en": "Option 1",
                "payload": "sdfsdf",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "metadata": {
      "blockType": "generic",
      "name": "GKmO2F18Tx-Ldq7HutCdV",
      "config": {},
      "linked_pages": [
        "708759082319392"
      ],
      "created_by": "admin001",
      "last_updated": "2025-10-17T04:02:55.486Z",
      "is_active": true
    },
    "linked_blocks": []
  },
  "mnyispiuziWl_Lbi9ldeF": {
    "kh": [
      {
        "template_type": "text",
        "is_active": true,
        "text": "asdfsadf"
      }
    ],
    "en": [
      {
        "template_type": "text",
        "is_active": true,
        "text": "asdfsadf"
      }
    ],
    "metadata": {
      "blockType": "text",
      "name": "mnyispiuziWl_Lbi9ldeF",
      "config": {},
      "linked_pages": [
        "708759082319392"
      ],
      "created_by": "admin001",
      "last_updated": "2025-10-17T04:02:55.486Z",
      "is_active": true
    },
    "linked_blocks": []
  },
  "yn3phfhjOg1RbxLGhrH-_": {
    "kh": [
      {
        "template_type": "text",
        "is_active": false,
        "text": "⚠️ មិនមានមាតិកាភាសាខ្មែរ"
      }
    ],
    "en": [
      {
        "template_type": "text",
        "is_active": false,
        "text": "⚠️ No English content available"
      }
    ],
    "metadata": {
      "blockType": "text",
      "name": "yn3phfhjOg1RbxLGhrH-_",
      "config": {},
      "linked_pages": [
        "708759082319392"
      ],
      "created_by": "admin001",
      "last_updated": "2025-10-17T04:02:55.486Z",
      "is_active": true
    },
    "linked_blocks": []
  }
}

{
  "flow_skin_care": {
    "canvas": { ... },
    "info_skin_care": {
      "kh": [text, generic],
      "en": [text, generic],
      "metadata": { ... },
      "linked_blocks": ["#123-xx", "node_abc"]
    },
    "#123-xx": {
      "kh": [...],
      "en": [...],
      "linked_blocks": []
    },
    "node_abc": {
      "kh": [...],
      "en": [...],
      "linked_blocks": []
    }
  }
}


flow:
featur-block(info_skin_care)
path1 => generic => "node_abc"
path1 => text

data:
{
  "flow_skin_care": {
    "info_skin_care": {
      "kh": [generic, text, text],
      "en": [generic, text, text],
      "metadata": { ... },
      "linked_blocks": ["#123-xx", "node_abc"]
    },
  }
}

{
  "flow_skin_care": {
    "canvas": { ... },
    "info_skin_care": {
      "kh": [text, generic],
      "en": [text, generic],
      "metadata": { ... },
      "linked_blocks": ["node_abc"]
    },
    "node_abc": {
      "kh": [...],
      "en": [...],
      "linked_blocks": []
    }
  }
}

no let I explain 

featur-block(info_skin_care)
path1 => generic => "Text id #123"
path1 => text

waht so should be


  I think you shoud do  find in all payload e.g #123 and find all nodes id which exist #123 fetch data as top level for database 

{
  
    "info_skin_care": {
      "kh": [text, generic],
      "en": [text, generic],
      "metadata": { ... },
      "linked_blocks": ["#123"]
    },
    "#123": {
      "kh": [.  ..],
      "en": [...],
      "linked_blocks": []
    }
  }



{
  "welcome": {
    "en": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 Welcome to E-SHOP KH! I am your digital assistant, how can I help you today?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "ℹ️ General Info",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_en": "📚 Product List & Prices",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_en": "💬 Chat with Shop",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "📦 Problem/Request",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_en": "💳 Payment Method",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_en": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "kh": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 ជម្រាបសួស្តិ៍ សូមស្វាគមន៍ មកកាន់ហាង E-SHOP KH! ខ្ញុំគឺជាជំនួយការឌីជីថល, តើមានអ្វីឲ្យខ្ញុំជួយបាន?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "ℹ️ អំពីពត៍មានទូទៅ",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_kh": "📚 បញ្ជីផលិតផល និង តម្លៃ",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_kh": "💬 ឆាតជាមួយបុគ្គលិកហាង",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "📦 បញ្ញាឥវ៉ាន/ការស្នើសុំ",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_kh": "💳 ការទូទាត់",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_kh": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "metadata": {
      "created_by": "admin001",
      "is_active": true,
      "last_updated": "2025-09-24T15:46",
      "linked_pages": ["708759082319392"],
      "version": 1
    }
  }
}

{
  "welcome": {
    "en": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 Welcome to E-SHOP KH! I am your digital assistant, how can I help you today?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "ℹ️ General Info",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_en": "📚 Product List & Prices",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_en": "💬 Chat with Shop",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "📦 Problem/Request",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_en": "💳 Payment Method",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_en": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "kh": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 ជម្រាបសួស្តិ៍ សូមស្វាគមន៍ មកកាន់ហាង E-SHOP KH! ខ្ញុំគឺជាជំនួយការឌីជីថល, តើមានអ្វីឲ្យខ្ញុំជួយបាន?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "ℹ️ អំពីពត៍មានទូទៅ",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_kh": "📚 បញ្ជីផលិតផល និង តម្លៃ",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_kh": "💬 ឆាតជាមួយបុគ្គលិកហាង",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "📦 បញ្ញាឥវ៉ាន/ការស្នើសុំ",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_kh": "💳 ការទូទាត់",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_kh": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "metadata": {
      "created_by": "admin001",
      "is_active": true,
      "last_updated": "2025-09-24T15:46",
      "linked_pages": ["708759082319392"],
      "version": 1
    }
  }
}


{ 
  "carousel": { 
    "canvas": { ... }, 
    "flow_data": {
       "en": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 Welcome to E-SHOP KH! I am your digital assistant, how can I help you today?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "ℹ️ General Info",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_en": "📚 Product List & Prices",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_en": "💬 Chat with Shop",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "📦 Problem/Request",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_en": "💳 Payment Method",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_en": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "kh": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 ជម្រាបសួស្តិ៍ សូមស្វាគមន៍ មកកាន់ហាង E-SHOP KH! ខ្ញុំគឺជាជំនួយការឌីជីថល, តើមានអ្វីឲ្យខ្ញុំជួយបាន?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "ℹ️ អំពីពត៍មានទូទៅ",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_kh": "📚 បញ្ជីផលិតផល និង តម្លៃ",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_kh": "💬 ឆាតជាមួយបុគ្គលិកហាង",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "📦 បញ្ញាឥវ៉ាន/ការស្នើសុំ",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_kh": "💳 ការទូទាត់",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_kh": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
     "linked_blocks": [],
     "metadata": { ... } 
     } 
  } 
}



{
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "ℹ️ អំពីពត៍មានទូទៅ",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_kh": "📚 បញ្ជីផលិតផល និង តម្លៃ",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_kh": "💬 ឆាតជាមួយបុគ្គលិកហាង",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "📦 បញ្ញាឥវ៉ាន/ការស្នើសុំ",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_kh": "💳 ការទូទាត់",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_kh": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }



      "product": {
  "en": [
    {
      "template_type": "text",
      "text": "...",
      "is_active": true
    },
    {
      "template_type": "generic",
      "silent": false,
      "is_active": true,
      "cards": [ ...multiple cards... ]
    }
  ],
  "kh": [
    {
      "template_type": "text",
      "text": "...",
      "is_active": true
    },
    {
      "template_type": "generic",
      "silent": false,
      "is_active": true,
      "cards": [ ...multiple cards... ]
    }
  ],
  "metadata": { ... }
}


{
  "Jf0jVDV1CHTbd6c2PwgDS": {
    "canvas": {
      "nodes": [
        {
          "data": {
            "cards": [
              {
                "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
                "layout": "hero",
                "options": [
                  {
                    "id": "O2oUaP_uvYdHjvyIpHNwR",
                    "label": "Option 1",
                    "label_en": "Option 1",
                    "label_kh": "asdf",
                    "payload": "asdf",
                    "type": "postback"
                  }
                ],
                "subtitle": "asdf",
                "subtitle_km": "asdf",
                "title": "asdf",
                "title_km": "sadf"
              }
            ],
            "condition": {
              "condition": "អ្នកប្រើបានបញ្ជាទិញផលិតផល",
              "id": "ordered"
            },
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
            "is_active": false,
            "kh_missing": true,
            "layout": "hero",
            "options": [
              {
                "id": "H8koWqtsU4baQYKoJuSEa",
                "label": "Option 1",
                "label_en": "Option 1",
                "label_kh": "",
                "payload": "",
                "type": "postback"
              }
            ],
            "subtitle": "",
            "title": ""
          },
          "dragging": false,
          "id": "Jf0jVDV1CHTbd6c2PwgDS",
          "measured": {
            "height": 393,
            "width": 320
          },
          "position": {
            "x": 272,
            "y": -352
          },
          "selected": true,
          "type": "generic-template"
        }
      ]
    },
    "flow_data": {
      "en": [
        {
          "cards": [
            {
              "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
              "layout": "hero",
              "options": [
                {
                  "label_en": "Option 1",
                  "label_kh": "asdf",
                  "payload": "asdf",
                  "type": "postback"
                }
              ],
              "subtitle": "asdf",
              "title": "asdf"
            }
          ],
          "is_active": false,
          "silent": false,
          "template_type": "generic"
        }
      ],
      "kh": [
        {
          "cards": [
            {
              "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
              "layout": "hero",
              "options": [
                {
                  "label_en": "Option 1",
                  "label_kh": "asdf",
                  "payload": "asdf",
                  "type": "postback"
                }
              ],
              "subtitle": "asdf",
              "title": "asdf"
            }
          ],
          "is_active": false,
          "silent": false,
          "template_type": "generic"
        }
      ],
      "metadata": {
        "blockType": "generic-template",
        "is_active": false,
        "last_updated": "2025-10-19T21:20:50.570Z",
        "name": "Jf0jVDV1CHTbd6c2PwgDS"
      }
    }
  },
  "product": {
    "canvas": {
      "edges": [
        {
          "id": "H3l0iXYEvcXMG_SBSQ0eG",
          "source": "SAGnV_bcWx4PdlJM3LMd5",
          "sourceHandle": "eoXQv4HCS8f6EgNpnHejC",
          "target": "RXNHAxgOBLRG9MmH6Pk0f",
          "type": "deletable"
        },
        {
          "id": "qF2C90PHYXJi5q_t6z8hD",
          "source": "RXNHAxgOBLRG9MmH6Pk0f",
          "sourceHandle": "87R9oYGdzOvSu0WK4BMEV",
          "target": "Jf0jVDV1CHTbd6c2PwgDS",
          "type": "deletable"
        }
      ],
      "nodes": [
        {
          "data": {
            "blockType": "carousel",
            "is_active": false,
            "kh_missing": false,
            "label": "",
            "name": "product",
            "paths": [
              {
                "blockType": "generic-template",
                "id": "eoXQv4HCS8f6EgNpnHejC",
                "label": "Card 1",
                "targetBlockId": "RXNHAxgOBLRG9MmH6Pk0f"
              },
              {
                "blockType": "generic-template",
                "id": "m2ccq3Halv0WVoKm5ZyPQ",
                "label": "Card 2"
              }
            ],
            "payload": ""
          },
          "dragging": false,
          "id": "SAGnV_bcWx4PdlJM3LMd5",
          "measured": {
            "height": 321,
            "width": 320
          },
          "position": {
            "x": -688,
            "y": -304
          },
          "selected": false,
          "type": "feature-block"
        },
        {
          "data": {
            "cards": [
              {
                "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
                "layout": "hero",
                "options": [
                  {
                    "id": "87R9oYGdzOvSu0WK4BMEV",
                    "label": "Option 1",
                    "label_en": "Option 1",
                    "label_kh": "sdf",
                    "payload": "Jf0jVDV1CHTbd6c2PwgDS",
                    "type": "postback"
                  }
                ],
                "subtitle": "asdf",
                "subtitle_km": "asdfasd",
                "title": "asdf",
                "title_km": "asdf"
              }
            ],
            "condition": {
              "condition": "អ្នកប្រើបានបញ្ជាទិញផលិតផល",
              "id": "ordered"
            },
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
            "is_active": false,
            "kh_missing": false,
            "layout": "hero",
            "options": [
              {
                "id": "jVk8mnAMgaG1XvxbNdUDx",
                "label": "Option 1",
                "label_en": "Option 1",
                "label_kh": "",
                "payload": "",
                "type": "postback"
              }
            ],
            "subtitle": "",
            "title": ""
          },
          "dragging": false,
          "id": "RXNHAxgOBLRG9MmH6Pk0f",
          "measured": {
            "height": 393,
            "width": 320
          },
          "position": {
            "x": -224,
            "y": -368
          },
          "selected": false,
          "type": "generic-template"
        },
        {
          "data": {
            "cards": [
              {
                "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
                "layout": "hero",
                "options": [
                  {
                    "id": "O2oUaP_uvYdHjvyIpHNwR",
                    "label": "Option 1",
                    "label_en": "Option 1",
                    "label_kh": "asdf",
                    "payload": "asdf",
                    "type": "postback"
                  }
                ],
                "subtitle": "asdf",
                "subtitle_km": "asdf",
                "title": "asdf",
                "title_km": "sadf"
              }
            ],
            "condition": {
              "condition": "អ្នកប្រើបានបញ្ជាទិញផលិតផល",
              "id": "ordered"
            },
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
            "is_active": false,
            "kh_missing": true,
            "layout": "hero",
            "options": [
              {
                "id": "H8koWqtsU4baQYKoJuSEa",
                "label": "Option 1",
                "label_en": "Option 1",
                "label_kh": "",
                "payload": "",
                "type": "postback"
              }
            ],
            "subtitle": "",
            "title": ""
          },
          "dragging": false,
          "id": "Jf0jVDV1CHTbd6c2PwgDS",
          "measured": {
            "height": 393,
            "width": 320
          },
          "position": {
            "x": 272,
            "y": -352
          },
          "selected": true,
          "type": "generic-template"
        }
      ]
    },
    "flow_data": {
      "en": [
        {
          "cards": [
            {
              "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
              "layout": "hero",
              "options": [
                {
                  "label_en": "Option 1",
                  "payload": "Jf0jVDV1CHTbd6c2PwgDS",
                  "type": "postback"
                }
              ],
              "subtitle": "asdf",
              "title": "asdf"
            }
          ],
          "is_active": false,
          "silent": false,
          "template_type": "generic"
        }
      ],
      "kh": [
        {
          "cards": [
            {
              "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/572772349252949/photo/Home.jpg",
              "layout": "hero",
              "options": [
                {
                  "label_kh": "sdf",
                  "payload": "Jf0jVDV1CHTbd6c2PwgDS",
                  "type": "postback"
                }
              ],
              "subtitle": "asdf",
              "title": "asdf"
            }
          ],
          "is_active": false,
          "silent": false,
          "template_type": "generic"
        }
      ],
      "linked_blocks": [
        "Jf0jVDV1CHTbd6c2PwgDS"
      ],
      "metadata": {
        "blockType": "carousel",
        "created_by": "admin001",
        "is_active": false,
        "last_updated": "2025-10-19T21:20:50.570Z",
        "linked_pages": [
          "708759082319392"
        ],
        "name": "product"
      }
    }
  }
}

I testing 
feature-block.info
path 1=> generic template
path 2=> text message 

data should be 

{
  "info_skin_care": {
    "canvas": { ... },
    "flow_data": { ... }
  }
}

case 1:
feature-block.info
path 1=> generic template
path 2=> text message 

case 2 
feature-block.info
path 1=> generic template =>generic template(Jf0jVDV1CHTbd6c2PwgDS)
path 2=> text message 

case 2 
feature-block.info
path 1=> generic template => text message( Egs6w_P6Frb3GY8fOlaLW)
path 2=> text message 

case 3:
feature-block.carousel
card 1=> generic template 
card 2=> generic template
card 3=> generic template


{

{
  "product": {
    "canvas": { ... },
    "flow_data": {
      "kh": [ ... ],
      "en": [ ... ],
      "linked_blocks": ["Jf0jVDV1CHTbd6c2PwgDS"], // ✅ valid feature block
      "metadata": { ... }
    }
  },
  "Jf0jVDV1CHTbd6c2PwgDS": {
    "canvas": { ... },
    "flow_data": { ... } // ✅ full block data
  }
}


}
thai id correct right?

"kh": [
  { template_type: "text", text: "សួស្តី! 👋 សូមស្វាគមន៍មកកាន់បុតខ្មែរ។" },
  { template_type: "generic", cards: [ ... ] }
],
"en": [
  { template_type: "text", text: "Hello! 👋 Welcome to KhmerAi.Chat." },
  { template_type: "generic", cards: [ ... ] }
]

2. 🔧 Extend Case 2: Promote payload-linked blocks to top-level export

const metadata: ExportedMetadata = {
  blockType: 'carousel',
  flow_name: 'product',
  name: 'product-carousel',
  created_by: 'admin001',
  last_updated: new Date().toISOString(),
  linked_pages: [],
  is_active: true,
  config: {
    auto_advance: true,
    delay_ms: 3000,
    show_dots: false
  }
}


✅ Current Coverage Summary
Case	Structure	Status
Case 1	feature-block.info → generic-template and → text-message	
Case 2a	feature-block.info → generic-template → generic-template (Jf0jVDV...)	
Case 2b	feature-block.info → generic-template → text-message (Egs6w_P6...)	
Case 3	feature-block.carousel → card 1/2/3 → generic-template	

Case 4: feature-block.info => generic template => feature-block.info => text-message
Case 5: carousel → card → generic-template → feature-block → generic-template → text-message  


Case 1, 2, and 3 remain untouched


🏁 Summary
Case	Structure	Status
1	feature-block → generic-template and → text-message	✅ Stable
2a	feature-block → generic-template → generic-template	✅ Stable
2b	feature-block → generic-template → text-message	✅ Stable
3	carousel → card → generic-template	✅ Stable
4	feature-block → generic-template → feature-block → text-message	✅ Stable
5	carousel → card → generic-template → feature-block → generic-template → text-message	✅ Stable
case 6:	feature-block → generic-template → feature-block  → generic-template → text-message
Case 7: feature-block → generic-template → generic-template → text-message
case 8:	feature-block → carousel → card  → generic-template → generic-template → text-message


✅ Realistic Depth Limits
While technically unbounded, here’s what’s safe and practical:

Depth	Structure Example	Status
1–3	Simple chains (Case 1–3)	✅ Instant
4–6	Nested feature-blocks and carousels (Case 4–6)	✅ Fast and safe
7–10	Deep chains with mixed types	✅ Safe, but test performance
>10	Very deep recursion	⚠️ Safe if no cycles, but test memory and export size

specail case 8:
case 8:	feature-block → carousel → card  → generic-template → generic-template → text-message

let be cleare avoide you not confuse
mean 
feature-block.info
path 1 => feature-bloc.carousel [generic care 1, generic card 2] and generic card 1 => text message 

that is specail because feature-block.info connect with feature-block.carousel maltiy cards of generic that we need handle wrap generic card 1 cand card 2 in feature-block.info and must respect with format bellow

setup:
feature-block.info
path 1 => text message 
path 2 => feature-bloc.carousel, option 1 => generic template, option 2 => generic tempalte => text message 

feature-block.info
├── path 1 → text-message
└── path 2 → carousel
      ├── card 1 → generic-template → text-message
      └── card 2 → generic-template


{ 
  "info_carousel": { 
    "canvas": { ... }, 
    "flow_data": {
       "en": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 Welcome to E-SHOP KH! I am your digital assistant, how can I help you today?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "ℹ️ General Info",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_en": "📚 Product List & Prices",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_en": "💬 Chat with Shop",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 Home",
            "subtitle": "Please choose one of the options below",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_en": "📦 Problem/Request",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_en": "💳 Payment Method",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_en": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
    "kh": [
      {
        "is_active": true,
        "template_type": "text",
        "text": "🙏 ជម្រាបសួស្តិ៍ សូមស្វាគមន៍ មកកាន់ហាង E-SHOP KH! ខ្ញុំគឺជាជំនួយការឌីជីថល, តើមានអ្វីឲ្យខ្ញុំជួយបាន?"
      },
      {
        "template_type": "generic",
        "silent": false,
        "is_active": true,
        "cards": [
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "ℹ️ អំពីពត៍មានទូទៅ",
                "payload": "info",
                "type": "postback"
              },
              {
                "label_kh": "📚 បញ្ជីផលិតផល និង តម្លៃ",
                "type": "web_url",
                "url": "http://eskh-030423.com"
              },
              {
                "label_kh": "💬 ឆាតជាមួយបុគ្គលិកហាង",
                "payload": "chatshop",
                "type": "postback"
              }
            ]
          },
          {
            "title": "🏡 ទំព័រដើម",
            "subtitle": "ជ្រើសរើសជម្រើសខាងក្រោម",
            "layout": "hero",
            "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/Home.jpg",
            "options": [
              {
                "label_kh": "📦 បញ្ញាឥវ៉ាន/ការស្នើសុំ",
                "payload": "problem",
                "type": "postback"
              },
              {
                "label_kh": "💳 ការទូទាត់",
                "payload": "payment",
                "type": "postback"
              },
              {
                "label_kh": "🇰🇭 ខ្មែរ / 🇺🇸 Eng",
                "payload": "language",
                "type": "postback"
              }
            ]
          }
        ]
      }
    ],
     "linked_blocks": [text-message(DjUQuRzWE_P-rqIX0i-wT)],
     "metadata": { ... } 
     } 
  },
   "DjUQuRzWE_P-rqIX0i-wT": {
    "canvas": { ... },
    "flow_data": { ... } 
  } 
}




{
  "product": {
    "canvas": { ... },
    "flow_data": {
      "kh": [ ... ],
      "en": [ ... ],
      "linked_blocks": ["Jf0jVDV1CHTbd6c2PwgDS"], // ✅ valid feature block
      "metadata": { ... }
    }
  },
  "Jf0jVDV1CHTbd6c2PwgDS": {
    "canvas": { ... },
    "flow_data": { ... } // ✅ full block data
  }
}

{
  "info_carousel": {
    "flow_data": {
      "en": [
        { "template_type": "text", "text": "🙏 Welcome..." },
        { "template_type": "generic", "cards": [card1, card2] }
      ],
      "kh": [
        { "template_type": "text", "text": "🙏 ជម្រាបសួស្តិ៍..." },
        { "template_type": "generic", "cards": [card1, card2] }
      ],
      "linked_blocks": ["DjUQuRzWE_P-rqIX0i-wT"],
      "metadata": { ... }
    }
  },
  "DjUQuRzWE_P-rqIX0i-wT": { // top level
    "canvas": { ... },
    "flow_data": { ... } 
  }
}

{
  "info_carousel": {
    "flow_data": {
      "en": [
        {
          "template_type": "text",
          "text": "🙏 Welcome..."
        },
        {
          "template_type": "generic",
          "cards": [/* card1, card2 */]
        }
      ],
      "kh": [
        {
          "template_type": "text",
          "text": "🙏 ជម្រាបសួស្តិ៍..."
        },
        {
          "template_type": "generic",
          "cards": [/* card1, card2 */]
        }
      ],
      "linked_blocks": ["DjUQuRzWE_P-rqIX0i-wT"],
      "metadata": { /* full ExportedMetadata */ }
    }
  },
    "DjUQuRzWE_P-rqIX0i-wT": { // top level
    "canvas": { ... },
    "flow_data": { ... } 
  }
}

🧪 Phase 1: Wrap All Cards and Template Nodes
{
  "info_carousel": {
    "flow_data": {
      "en": [
        { "template_type": "text", "text": "🙏 Welcome..." },
        { "template_type": "generic", "cards": [card1, card2] }
      ],
      "kh": [
        { "template_type": "text", "text": "🙏 ជម្រាបសួស្តិ៍..." },
        { "template_type": "generic", "cards": [card1, card2] }
      ],
      "linked_blocks": [],
      "metadata": { ... }
    }
  }
}

{
  "info_carousel": {
    "canvas": { /* full node + edge graph */ },
    "flow_data": {
      "en": [
        {
          "template_type": "text",
          "is_active": true,
          "text": "🙏 Welcome to E-SHOP KH! I am your digital assistant, how can I help you today?"
        },
        {
          "template_type": "generic",
          "silent": false,
          "is_active": true,
          "cards": [/* card1, card2 */]
        }
      ],
      "kh": [
        {
          "template_type": "text",
          "is_active": true,
          "text": "🙏 ជម្រាបសួស្តិ៍ សូមស្វាគមន៍ មកកាន់ហាង E-SHOP KH! ខ្ញុំគឺជាជំនួយការឌីជីថល, តើមានអ្វីឲ្យខ្ញុំជួយបាន?"
        },
        {
          "template_type": "generic",
          "silent": false,
          "is_active": true,
          "cards": [/* card1, card2 */]
        }
      ],
      "linked_blocks": ["DjUQuRzWE_P-rqIX0i-wT"],
      "metadata": {
        "blockType": "info",
        "flow_name": "info_carousel",
        "name": "info_carousel",
        "created_by": "admin001",
        "last_updated": "2025-10-22T13:15:00.000Z",
        "is_active": true,
        "linked_pages": ["708759082319392"],
        "config": {}
      }
    }
  }
}



🧪 Phase 2: Export Top-Level Blocks
{
  "info_carousel": {
    "flow_data": {
      "en": [
        { "template_type": "text", "text": "🙏 Welcome..." },
        { "template_type": "generic", "cards": [card1, card2] }
      ],
      "kh": [
        { "template_type": "text", "text": "🙏 ជម្រាបសួស្តិ៍..." },
        { "template_type": "generic", "cards": [card1, card2] }
      ],
      "linked_blocks": ["DjUQuRzWE_P-rqIX0i-wT"],
      "metadata": { ... }
    }
  }
}

Phase 3: 
feature-block.info
├── path 1 → text-message
└── path 2 → carousel
      ├── card 1 → generic-template → carousel → generic-template 
      └── card 2 → generic-template


✅ Confirmed Behaviors
carousel 1 is merged inline into info_skin_care and skipped during top-level export.

carousel 2 is linked via fallback payload and exported as a top-level block.

All generic templates are wrapped as cards and deduplicated.

Deep payloads are recursively linked and validated.

visited and mergedCarousels are correctly tracked.

Final export contains:

info_skin_care

carousel 2

Any deep-linked blocks from carousel 2


Phase 3: 
feature-block.info
├── path 1 → text-message
└── path 2 → carousel
      ├── card 1 → generic-template → carousel → generic-template 
      └── card 2 → generic-template


feature-block.info  → carousel → generic-template → carousel → generic-template → generic-template

❌ What’s Not Working
When the chain goes one level deeper:

feature-block.info
→ carousel
→ generic-template
→ carousel
→ generic-template
→ generic-template
→ generic-template (deep link)



✅ Validation Checklist: Deep Linking After useCanvasStore Update
Case	Structure	Status
1	feature-block → generic-template → text-message	✅ Recheck
2a	feature-block → generic-template → generic-template	✅ Recheck
2b	feature-block → generic-template → text-message	✅ Recheck
3	carousel → card → generic-template	✅ Recheck
4	feature-block → generic-template → feature-block → text-message	✅ Recheck
5	carousel → card → generic-template → feature-block → generic-template → text-message	✅ Recheck
6	feature-block → generic-template → feature-block → generic-template → text-message	🔄 New deep recursion — validate carefully
7	feature-block → generic-template → generic-template → text-message	🔄 Similar to 2a + 2b — validate
8	feature-block → carousel → card → generic-template → generic-template → text-message	🔄 Mixed type chain — validate deeply
🧠 What to Confirm for Each Case
✅ Node restoration: All nodes and paths load correctly from snapshot

✅ Path linking: Each path correctly connects to the next block

✅ Recursive flow: No infinite loops or broken references

✅ Messenger preview: Final output is correct and Khmer-safe

✅ Export logic: All blocks are promoted and delivered correctly

✅ UI state: No layout glitches, scroll issues, or missing handles

🧩 Suggested Test Strategy
Load snapshot for each case

Visually inspect node chain

Trigger Messenger preview

Export and inspect payload

Check useCanvasStore state: nodes, edges, active block

Validate deep-linking logic: getNextBlock, resolvePath, etc.




type FeatureBlock = {
  block_id: string
  block_name: string
  block_type: 'info' | 'welcome' | 'menu' | 'product' | 'carousel' | ...
  is_active: boolean
  tags: string[]
  linked_pages: string[]
  created_by: string
  last_updated: string
  version: number

  templates: Record<string, Template>
  canvas: {
    layout: 'vertical' | 'horizontal'
    paths: string[] // template_ids
    condition?: {
      trigger: 'user_message' | 'postback' | 'intent'
      match: 'includes' | 'equals' | 'starts_with' | ...
      value: string
    }
  }
}


{
  template_id: 'info_text_en',
  template_type: 'text',
  lang: 'en',
  is_active: true,
  text: '🧴 Our skincare products are gentle...'
}


{
  template_id: 'info_generic_kh',
  template_type: 'generic',
  lang: 'kh',
  is_active: true,
  cards: [
    {
      title: 'របៀបថែសម្រស់',
      subtitle: 'ជ្រើសរើសប្រភេទស្បែករបស់អ្នក',
      image_url: '...',
      options: [
        { label_kh: 'ស្បែកស្ងួត', payload: 'dry_skin', type: 'postback' },
        { label_kh: 'ស្បែកប្រេង', payload: 'oily_skin', type: 'postback' }
      ]
    }
  ]
}

{
  "feature_blocks": {
    "info_skin_care": {
      "block_id": "info_skin_care",
      "block_name": "Skincare Tips",
      "block_type": "info",
      "is_active": true,
      "tags": ["beauty", "education"],
      "linked_pages": ["708759082319392"],
      "created_by": "admin001",
      "last_updated": "2025-11-02T16:45",
      "version": 1,

      "templates": {
        "info_text_en": {
          "template_id": "info_text_en",
          "template_type": "text",
          "lang": "en",
          "is_active": true,
          "text": "🧴 Our skincare products are gentle, effective, and made for Cambodian skin."
        },
        "info_text_kh": {
          "template_id": "info_text_kh",
          "template_type": "text",
          "lang": "kh",
          "is_active": true,
          "text": "🧴 ផលិតផលថែសម្រស់របស់យើង សមស្របសម្រាប់ស្បែកខ្មែរ និងមានប្រសិទ្ធភាព។"
        },
        "info_generic_en": {
          "template_id": "info_generic_en",
          "template_type": "generic",
          "lang": "en",
          "is_active": true,
          "cards": [
            {
              "title": "Skincare Routine",
              "subtitle": "Choose your skin type",
              "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/skincare.jpg",
              "options": [
                { "label_en": "Dry Skin", "payload": "dry_skin", "type": "postback" },
                { "label_en": "Oily Skin", "payload": "oily_skin", "type": "postback" }
              ]
            }
          ]
        },
        "info_generic_kh": {
          "template_id": "info_generic_kh",
          "template_type": "generic",
          "lang": "kh",
          "is_active": true,
          "cards": [
            {
              "title": "របៀបថែសម្រស់",
              "subtitle": "ជ្រើសរើសប្រភេទស្បែករបស់អ្នក",
              "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/skincare.jpg",
              "options": [
                { "label_kh": "ស្បែកស្ងួត", "payload": "dry_skin", "type": "postback" },
                { "label_kh": "ស្បែកប្រេង", "payload": "oily_skin", "type": "postback" }
              ]
            }
          ]
        }
      },

      "canvas": {
        "layout": "vertical",
        "paths": ["info_text_en", "info_generic_en"],
        "condition": {
          "trigger": "user_message",
          "match": "includes",
          "value": "skincare"
        }
      }
    }
  }
}


we have 

feature_blocks:{
  info:{},
  welcome:{},
  product:{},
  menu:{},
  carousel:{},
  intent:{}
}

{
  "feature_blocks_by_type": {
    "info": {
      "info_skin_care": { ... },
      "info_contact": { ... }
    },
    "welcome": {
      "welcome_main": { ... }
    },
    "menu": {
      "menu_main": { ... }
    },
    "product": {
      "product_soap": { ... }
    },
    "carousel": {
      "carousel_products": { ... }
    },
    "intent": {
      "intent_price": { ... }
    }
  },

  "feature_block_index": {
    "info_skin_care": "info",
    "welcome_main": "welcome",
    "menu_main": "menu",
    "product_soap": "product",
    "carousel_products": "carousel",
    "intent_price": "intent"
  }
}

✅ 1. Block Organization in Firebase
We group blocks by type for clarity and cheap reads:

json
feature_blocks_by_type: {
  info: { info_skin_care: { ... }, info_contact: { ... } },
  welcome: { welcome_main: { ... } },
  menu: { menu_main: { ... } },
  product: { product_soap: { ... } },
  carousel: { carousel_products: { ... } },
  intent: { intent_price: { ... } }
},
feature_block_index: {
  info_skin_care: "info",
  welcome_main: "welcome",
  menu_main: "menu",
  product_soap: "product",
  carousel_products: "carousel",
  intent_price: "intent"
}
✅ 2. Block Structure
Each block includes:

ts
type FeatureBlock = {
  block_id: string
  block_name: string
  block_type: string
  is_active: boolean
  tags: string[]
  linked_pages: string[]
  created_by: string
  last_updated: string
  version: number

  entry_trigger: 'message' | 'ref_url' | 'qr_code' | 'comment' | 'ad_click' | 'shop_message'
  entry_condition: {
    match: 'includes' | 'equals' | 'starts_with'
    value: string
  }

  templates: Record<string, Template>
  canvas: {
    layout: 'vertical' | 'horizontal'
    paths: PathItem[]
  }
}
✅ 3. Template Types
Each block can contain multiple templates:

ts
type TextTemplate = {
  template_id: string
  template_type: 'text'
  lang: 'en' | 'kh'
  is_active: boolean
  text: string
}

type GenericTemplate = {
  template_id: string
  template_type: 'generic'
  lang: 'en' | 'kh'
  is_active: boolean
  cards: Card[]
}

type Card = {
  title: string
  subtitle?: string
  image_url?: string
  options: {
    label_en?: string
    label_kh?: string
    payload: string
    type: 'postback' | 'web_url'
  }[]
}
✅ 4. Canvas Paths with Wait Triggers
Each path can be immediate or conditional:

ts
type PathItem = {
  template_id: string
  send_immediately: boolean
  trigger?: 'user_message' | 'postback' | 'intent'
  condition?: {
    match: 'includes' | 'equals' | 'starts_with'
    value: string
  }
  delay?: {
    seconds: number
    target?: string
  }
}
✅ 5. Trigger Logic Distinction
We separate:

Type	Field	Purpose
Start Trigger	entry_trigger + entry_condition	Starts the block
Wait Trigger	canvas.paths[n].trigger + condition	Waits for user input before continuing
✅ 6. Flow Patterns Supported
🔹 Pattern A: Immediate Flow
Block starts

All paths sent immediately

🔹 Pattern B: Conditional Flow
Block starts

First path sent

Second path waits for user input (e.g. “how much?”)

✅ 7. Realtime Database Benefits
Flat keys for cheap reads

Grouped by type for admin clarity

Indexed for fast lookup

Canvas is React-friendly

Templates are reusable and language-specific

Flow compiler can generate Messenger-safe flow_data



{
  "feature_blocks_by_type": {
    "info": {
      "info_skin_care": {
        "block_id": "info_skin_care",
        "block_name": "Skincare Tips",
        "block_type": "info",
        "is_active": true,
        "tags": ["beauty", "education"],
        "linked_pages": ["708759082319392"],
        "created_by": "admin001",
        "last_updated": "2025-11-02T16:45",
        "version": 1,

        "entry_trigger": "message",
        "entry_condition": {
          "match": "includes",
          "value": "skincare"
        },

        "templates": {
          "info_text_en": {
            "template_id": "info_text_en",
            "template_type": "text",
            "lang": "en",
            "is_active": true,
            "text": "🧴 Our skincare products are gentle, effective, and made for Cambodian skin."
          },
          "info_generic_en": {
            "template_id": "info_generic_en",
            "template_type": "generic",
            "lang": "en",
            "is_active": true,
            "cards": [
              {
                "title": "Skincare Routine",
                "subtitle": "Choose your skin type",
                "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/skincare.jpg",
                "options": [
                  { "label_en": "Dry Skin", "payload": "dry_skin", "type": "postback" },
                  { "label_en": "Oily Skin", "payload": "oily_skin", "type": "postback" }
                ]
              }
            ]
          },
          "info_text_kh": {
            "template_id": "info_text_kh",
            "template_type": "text",
            "lang": "kh",
            "is_active": true,
            "text": "🧴 ផលិតផលថែសម្រស់របស់យើង សមស្របសម្រាប់ស្បែកខ្មែរ និងមានប្រសិទ្ធភាព។"
          },
          "info_generic_kh": {
            "template_id": "info_generic_kh",
            "template_type": "generic",
            "lang": "kh",
            "is_active": true,
            "cards": [
              {
                "title": "របៀបថែសម្រស់",
                "subtitle": "ជ្រើសរើសប្រភេទស្បែករបស់អ្នក",
                "image_url": "https://storage.googleapis.com/khmer_aichatbot/clients/708759082319392/photo/skincare.jpg",
                "options": [
                  { "label_kh": "ស្បែកស្ងួត", "payload": "dry_skin", "type": "postback" },
                  { "label_kh": "ស្បែកប្រេង", "payload": "oily_skin", "type": "postback" }
                ]
              }
            ]
          }
        },

        "canvas": {
          "layout": "vertical",
          "paths": [
            {
              "template_id": "info_generic_en",
              "send_immediately": true
            },
            {
              "template_id": "info_text_en",
              "send_immediately": false,
              "trigger": "user_message",
              "condition": {
                "match": "includes",
                "value": "how much"
              }
            }
          ]
        }
      }
    },

    "welcome": {
      "welcome_main": {
        "block_id": "welcome_main",
        "block_name": "Welcome Block",
        "block_type": "welcome",
        "is_active": true,
        "entry_trigger": "message",
        "entry_condition": {
          "match": "equals",
          "value": "start"
        },
        "templates": {
          "welcome_generic_en": {
            "template_id": "welcome_generic_en",
            "template_type": "generic",
            "lang": "en",
            "is_active": true,
            "cards": [
              {
                "title": "Welcome!",
                "subtitle": "What would you like to explore?",
                "options": [
                  { "label_en": "Products", "payload": "show_products", "type": "postback" },
                  { "label_en": "Contact", "payload": "show_contact", "type": "postback" }
                ]
              }
            ]
          }
        },
        "canvas": {
          "layout": "vertical",
          "paths": [
            {
              "template_id": "welcome_generic_en",
              "send_immediately": true
            }
          ]
        }
      }
    }

    // Add more types: menu, product, carousel, intent...
  }
}


"feature_blocks_by_type": {
  "info": { ... },
  "welcome": { ... },
  "product": { ... },
  "menu": { ... }
}


{
  templates: {
    info_generic_en: { ... },
    info_generic_kh: { ... },
    info_text_en: { ... },
    info_text_kh: { ... }
  },
  paths: [
    {
      template_id: "info_generic_en",
      send_immediately: true,
      trigger: "immediate",
      condition: { match: "includes", value: "" },
      blockType: "text-message",
      expected_intent: "",
      intent_confidence: 0.7,
      label: "Path 1"
    },
    {
      template_id: "info_text_en",
      send_immediately: false,
      trigger: "user_message",
      condition: { match: "includes", value: "how much" },
      blockType: "text-message",
      expected_intent: "",
      intent_confidence: 0.7,
      label: "Path 2"
    }
  ]
}



template_id	: Links to Messenger template for delivery
send_immediately: Controls timing of delivery
blockType: 	Type of block (e.g. text-message, carousel)
label: 	Optional label for admin clarity
trigger: 	Trigger type (immediate, user_message, etc.)
detection_mode: 	Detection logic (keyword, intent, etc.)
expected_intent: 	Optional intent name for AI routing
intent_confidence: 	Confidence threshold for intent matching
condition: 	Match logic for keyword or value


{
  templates: {
    "-BhlBuwbVkKRCxGuD1d9M_en": {
      template_id: "-BhlBuwbVkKRCxGuD1d9M_en",
      template_type: "text",
      lang: "en",
      is_active: true,
      text: "Welcome to KhmerAi.Chat!",
      tone: "neutral",
      emoji_style: "minimal",
      delay_seconds: 0,
      show_typing: true
    },
    "-BhlBuwbVkKRCxGuD1d9M_kh": {
      template_id: "-BhlBuwbVkKRCxGuD1d9M_kh",
      template_type: "text",
      lang: "kh",
      is_active: true,
      text: "សូមស្វាគមន៍មកកាន់ KhmerAi.Chat!",
      tone: "neutral",
      emoji_style: "minimal",
      delay_seconds: 0,
      show_typing: true
    },
    "sNnOFB_XuTAdMsjU4aN15_en": {
      template_id: "sNnOFB_XuTAdMsjU4aN15_en",
      template_type: "text",
      lang: "en",
      is_active: true,
      text: "Welcome to KhmerAi.Chat!",
      tone: "neutral",
      emoji_style: "minimal",
      delay_seconds: 0,
      show_typing: true
    },
    "sNnOFB_XuTAdMsjU4aN15_kh": {
      template_id: "sNnOFB_XuTAdMsjU4aN15_kh",
      template_type: "text",
      lang: "kh",
      is_active: true,
      text: "សូមស្វាគមន៍មកកាន់ KhmerAi.Chat!",
      tone: "neutral",
      emoji_style: "minimal",
      delay_seconds: 0,
      show_typing: true
    }
  },
  paths: [
    {
      template_id: "sNnOFB_XuTAdMsjU4aN15",
      send_immediately: true,
      blockType: "info",
      label: "Path 1",
      trigger: "immediate",
      detection_mode: "keyword",
      expected_intent: "",
      intent_confidence: 0.7,
      condition: { match: "includes", value: "" }
    },
    {
      template_id: "-BhlBuwbVkKRCxGuD1d9M",
      send_immediately: true,
      blockType: "text-message",
      label: "Path 2",
      trigger: "immediate",
      detection_mode: "keyword",
      expected_intent: "",
      intent_confidence: 0.85,
      condition: { match: "includes", value: "" }
    }
  ]
}


{
  templates: {
    welcome_generic_en: {
      template_id: "welcome_generic_en",
      template_type: "generic",
      lang: "en",
      is_active: true,
      cards: [
        {
          title: "Welcome!",
          subtitle: "What would you like to explore?",
          options: [
            { label_en: "Products", payload: "show_products", type: "postback" },
            { label_en: "Contact", payload: "show_contact", type: "postback" }
          ]
        }
      ]
    },
    welcome_generic_kh: {
      template_id: "welcome_generic_kh",
      template_type: "text",
      lang: "kh",
      is_active: true,
      text: "សូមស្វាគមន៍មកកាន់ KhmerAi.Chat!",
      tone: "neutral",
      emoji_style: "minimal",
      delay_seconds: 0,
      show_typing: true
    }
  },
  paths: [
    {
      template_id: "welcome_generic_en",
      send_immediately: true,
      blockType: "generic-template",
      label: "Path 1",
      trigger: "immediate",
      detection_mode: "keyword",
      expected_intent: "",
      intent_confidence: 0.7,
      condition: { match: "includes", value: "" }
    }
  ]
}


{
  "feature_blocks_by_type": {
    "info": {
      "info_skin_care": {
        "block_id": "info_skin_care",
        "block_name": "Skincare Tips",
        "block_type": "info",
        "is_active": true,
        "created_by": "admin001",
        "last_updated": "2025-11-07T08:10",
        "version": 1,

        "entry_trigger": "message",
        "entry_condition": {
          "match": "includes",
          "value": "skincare"
        },

        "templates": {
          "info_text_en": {
            "template_id": "info_text_en",
            "template_type": "text",
            "lang": "en",
            "is_active": true,
            "text": "🧴 Our skincare products are gentle, effective, and made for Cambodian skin.",
            "delay_seconds": 0,
            "emoji_style": "minimal",
            "tone": "neutral",
            "show_typing": true
          },
          "info_text_kh": {
            "template_id": "info_text_kh",
            "template_type": "text",
            "lang": "kh",
            "is_active": true,
            "text": "🧴 ផលិតផលថែសម្រស់របស់យើង សមស្របសម្រាប់ស្បែកខ្មែរ និងមានប្រសិទ្ធភាព។",
            "delay_seconds": 0,
            "emoji_style": "minimal",
            "tone": "neutral",
            "show_typing": true
          },
          "info_generic_en": {
            "template_id": "info_generic_en",
            "template_type": "generic",
            "lang": "en",
            "is_active": true,
            "cards": [
              {
                "title": "Skincare Routine",
                "subtitle": "Choose your skin type",
                "image_url": "https://storage.googleapis.com/khmer_aichatbot/photo/skincare.jpg",
                "options": [
                  { "label_en": "Dry Skin", "payload": "dry_skin", "type": "postback" },
                  { "label_en": "Oily Skin", "payload": "oily_skin", "type": "postback" }
                ]
              }
            ]
          },
          "info_generic_kh": {
            "template_id": "info_generic_kh",
            "template_type": "generic",
            "lang": "kh",
            "is_active": true,
            "cards": [
              {
                "title": "របៀបថែសម្រស់",
                "subtitle": "ជ្រើសរើសប្រភេទស្បែករបស់អ្នក",
                "image_url": "https://storage.googleapis.com/khmer_aichatbot/photo/skincare.jpg",
                "options": [
                  { "label_kh": "ស្បែកស្ងួត", "payload": "dry_skin", "type": "postback" },
                  { "label_kh": "ស្បែកប្រេង", "payload": "oily_skin", "type": "postback" }
                ]
              }
            ]
          }
        },

        "canvas": {
          "layout": "vertical",
          "paths": [
            {
              "template_id": "info_generic_en",
              "send_immediately": true
            },
            {
              "template_id": "info_text_en",
              "send_immediately": false,
              "trigger": "user_message",
              "condition": {
                "match": "includes",
                "value": "how much"
              }
            }
          ]
        }
      }
    },

    "welcome": {
      "welcome_main": {
        "block_id": "welcome_main",
        "block_name": "Welcome Block",
        "block_type": "welcome",
        "is_active": true,
        "entry_trigger": "message",
        "entry_condition": {
          "match": "equals",
          "value": "start"
        },
        "templates": {
          "welcome_generic_en": {
            "template_id": "welcome_generic_en",
            "template_type": "generic",
            "lang": "en",
            "is_active": true,
            "cards": [
              {
                "title": "Welcome!",
                "subtitle": "What would you like to explore?",
                "options": [
                  { "label_en": "Products", "payload": "show_products", "type": "postback" },
                  { "label_en": "Contact", "payload": "show_contact", "type": "postback" }
                ]
              }
            ]
          }
        },
        "canvas": {
          "layout": "vertical",
          "paths": [
            {
              "template_id": "welcome_generic_en",
              "send_immediately": true
            }
          ]
        }
      }
    },

    "product": {
      "product_lotion": {
        "block_id": "product_lotion",
        "block_name": "Lotion Info",
        "block_type": "product",
        "is_active": true,
        "templates": {
          "product_text_en": {
            "template_id": "product_text_en",
            "template_type": "text",
            "lang": "en",
            "is_active": true,
            "text": "Our lotion is lightweight and perfect for dry skin.",
            "tone": "neutral",
            "delay_seconds": 0,
            "emoji_style": "minimal",
            "show_typing": true
          }
        },
        "canvas": {
          "layout": "vertical",
          "paths": [
            {
              "template_id": "product_text_en",
              "send_immediately": true
            }
          ]
        }
      }
    }
  },

  "is_draft": true,
  "last_saved_at": "2025-11-07T08:10",
  "saved_by": "admin001"
}


"feature_blocks_by_type" : {
  "info":{...}:,
  "welcome":{...},
  "product":{...},

  "is_draft": true,
  "last_saved_at": "2025-11-07T08:10",
  "saved_by": "admin001"
}

"feature_blocks_by_type" : {
  "info":{
    ....,
    "temmplates":{
      template1,
      template2
    }
  },
 

  "is_draft": true,
  "last_saved_at": "2025-11-07T08:10",
  "saved_by": "admin001"
}

"all templates nodes data":{
  hold data template nodes
}

as before you remments me each template node allow admin options input name if not exist name handle node id instead 
that is good idea for reuse 

admin create text message.name : specail_info 
admin can easy to manager conntent by name better node id not undersant what is inside 

we create to lists panel Flow List , what we did ready 
and another template lists this hold all templates for reuse able 

recap:
feature_blocks_by_type: hold block list with lists and address, globl config 
all templates lists : hold each template data independent for call to use 
what i explain just the draft concep that need you analysis if make sense you can upgrade if not no problem we find another solution 

{
  "feature_blocks_by_type": {
    "info": {
      "info_skin_care": {
        "block_id": "info_skin_care",
        "block_name": "Skincare Tips",
        "block_type": "info",
        "entry_trigger": "message",
        "entry_condition": { "match": "includes", "value": "skincare" },
        "canvas": {
          "layout": "vertical",
          "paths": [
            {
              "template_ref": "special_info", // ✅ reference by name
              "send_immediately": true
            },
            {
              "template_ref": "info_generic_en",
              "trigger": "user_message",
              "condition": { "match": "includes", "value": "how much" }
            }
          ]
        }
      }
    },
    "welcome": { ... },
    "product": { ... }
  },

  "all_templates_nodes_data": {
    "special_info": {
      "template_id": "special_info",
      "template_type": "text",
      "lang": "en",
      "is_active": true,
      "text": "Hello from KhmerAi.Chat!",
      "tone": "neutral",
      "delay_seconds": 0,
      "emoji_style": "minimal",
      "show_typing": true
    },
    "info_generic_en": {
      "template_id": "info_generic_en",
      "template_type": "generic",
      "lang": "en",
      "is_active": true,
      "cards": [ ... ]
    }
  },

  "is_draft": true,
  "last_saved_at": "2025-11-07T08:10",
  "saved_by": "admin001"
}


       

🔧 Next Implementation Steps
1. Export Logic Upgrade
Extract all templates into shared_templates

Replace template_id with template_ref in canvas paths

Strip duplicate config from locales and centralize under config

2. Import Logic Upgrade
Re-link template_ref to shared_templates

Validate that every template_ref exists

Auto-generate fallback names if missing

3. Payload Router
Match "payload": "block_name" to feature_blocks_by_type

Trigger canvas delivery from that block

Support deep links, postbacks, and admin commands like !info info_skin_care

4. Admin UI Panels
Flow List Panel: shows all blocks, entry triggers, and canvas paths

Template List Panel: shows all reusable templates, editable by name

Message Viewer: simulates delivery using template_ref and locales

5. Validation Toolkit
Auto-flag broken template_ref or unused templates

Highlight duplicate payloads or unreachable blocks

Surface debug info in export and preview

✅ KhmerAi.Chat is now:
Modular and reusable

Messenger-safe and Firebase-efficient

Admin-friendly and scalable

Ready for preview, broadcast, and deep link delivery

Let me know which part you want to scaffold first — export logic, payload router, or UI panel. You’ve built a system that’s ready to empower every Khmer admin.

shared_templates

"feature_blocks_by_type" : {
  "info":{
    ....,
    "temmplates":{
    }
  },
 

  "is_draft": true,
  "last_saved_at": "2025-11-07T08:10",
  "saved_by": "admin001"
}

"shared_templates":{
  
}

{
  "feature_blocks_by_type": {
    "info": {
      "RWQAbqX27pKeV-bWCVIUg": {
        "block_name": "skin_care",
        "templates": {
          "template_id_en": { ... },
          "template_id_kh": { ... }
        },
        ...
      }
    }
  },
  "shared_templates": {}, // ✅ now empty
  "is_draft": true,
  "last_saved_at": "...",
  "saved_by": "admin001"
}




"feature_blocks_by_type": {
  "info": {
    "info_skin_care": {
      "canvas": {
        "paths": [
          { "template_ref": "skin_care_intro" }
        ]
      }
    }
  }
},

"shared_templates": {
  "skin_care_intro": {
    "template_id": "skin_care_intro",
    "template_type": "text",
    "is_active": true,
    "config": {
      "delay_seconds": 0,
      "emoji_style": "minimal",
      "tone": "neutral",
      "show_typing": true
    },
    "locales": {
      "en": { "lang": "en", "text": "🧴 Our skincare products are gentle and effective." },
      "kh": { "lang": "kh", "text": "🧴 ផលិតផលថែសម្រស់របស់យើង មានប្រសិទ្ធភាព។" }
    }
  }
}



{
  "feature_blocks_by_type": {
    "info": {
      "info_skin_care": {
        "block_id": "info_skin_care",
        "block_name": "Skincare Tips",
        "block_type": "info",
        "entry_trigger": "message",
        "entry_condition": {
          "match": "includes",
          "value": "skincare"
        },
        "canvas": {
          "layout": "vertical",
          "paths": [
            {
              "template_ref": "skin_care_intro", // ✅ Path 1: direct text
              "send_immediately": true
            },
            {
              "template_ref": "skin_type_selector", // ✅ Path 2: generic
              "send_immediately": true,
              "next": {
                "template_ref": "skin_type_detail", // ✅ second generic
                "send_immediately": true,
                "next": {
                  "template_ref": "skin_type_tip", // ✅ final text
                  "send_immediately": true
                }
              }
            }
          ]
        }
      }
    }
  },

  "shared_templates": {
    "skin_care_intro": {
      "template_id": "skin_care_intro",
      "template_type": "text",
      "is_active": true,
      "config": {
        "delay_seconds": 0,
        "emoji_style": "minimal",
        "tone": "neutral",
        "show_typing": true
      },
      "locales": {
        "en": {
          "lang": "en",
          "text": "🧴 Our skincare products are gentle, effective, and made for Cambodian skin."
        },
        "kh": {
          "lang": "kh",
          "text": "🧴 ផលិតផលថែសម្រស់របស់យើង សមស្របសម្រាប់ស្បែកខ្មែរ និងមានប្រសិទ្ធភាព។"
        }
      }
    },

    "skin_type_selector": {
      "template_id": "skin_type_selector",
      "template_type": "generic",
      "is_active": true,
      "config": {
        "tone": "neutral"
      },
      "locales": {
        "en": {
          "lang": "en",
          "cards": [
            {
              "title": "Choose your skin type",
              "subtitle": "We'll recommend a routine",
              "options": [
                { "label_en": "Dry Skin", "payload": "dry_skin", "type": "postback" },
                { "label_en": "Oily Skin", "payload": "oily_skin", "type": "postback" }
              ]
            }
          ]
        },
        "kh": {
          "lang": "kh",
          "cards": [
            {
              "title": "ជ្រើសរើសប្រភេទស្បែក",
              "subtitle": "យើងនឹងផ្តល់អនុសាសន៍",
              "options": [
                { "label_kh": "ស្បែកស្ងួត", "payload": "dry_skin", "type": "postback" },
                { "label_kh": "ស្បែកប្រេង", "payload": "oily_skin", "type": "postback" }
              ]
            }
          ]
        }
      }
    },

    "skin_type_detail": {
      "template_id": "skin_type_detail",
      "template_type": "generic",
      "is_active": true,
      "config": {
        "tone": "neutral"
      },
      "locales": {
        "en": {
          "lang": "en",
          "cards": [
            {
              "title": "Dry Skin Routine",
              "subtitle": "Gentle cleanser + hydrating lotion",
              "options": [
                { "label_en": "See Tips", "payload": "show_tips", "type": "postback" }
              ]
            }
          ]
        },
        "kh": {
          "lang": "kh",
          "cards": [
            {
              "title": "របៀបថែស្បែកស្ងួត",
              "subtitle": "សាប៊ូសម្រួល + ឡេបន្ថែមសំណើម",
              "options": [
                { "label_kh": "មើលអនុសាសន៍", "payload": "show_tips", "type": "postback" }
              ]
            }
          ]
        }
      }
    },

    "skin_type_tip": {
      "template_id": "skin_type_tip",
      "template_type": "text",
      "is_active": true,
      "config": {
        "delay_seconds": 1,
        "emoji_style": "minimal",
        "tone": "friendly",
        "show_typing": true
      },
      "locales": {
        "en": {
          "lang": "en",
          "text": "💡 Tip: Apply lotion while skin is still damp to lock in moisture."
        },
        "kh": {
          "lang": "kh",
          "text": "💡 អនុសាសន៍៖ លាបឡេនៅពេលស្បែកនៅសើម ដើម្បីរក្សាសំណើម។"
        }
      }
    }
  }
}


{
  feature_blocks_by_type: {
    info: {
      info_skin_care: {
        block_id: "info_skin_care",
        block_name: "Skincare Tips",
        block_type: "info",
        entry_trigger: "message",
        entry_condition: { match: "includes", value: "skincare" },
        canvas: {
          layout: "vertical",
          paths: [ ... ] // ✅ normalized with template_ref only
        }
      }
    }
  },
  shared_templates: {
    skin_care_intro: { ... },
    skin_type_selector: { ... },
    skin_type_detail: { ... },
    skin_type_tip: { ... }
  },
  is_draft: true,
  last_saved_at: "...",
  saved_by: "admin001"
}


{
  "feature_blocks_by_type": {
    "info": {
      "info_skin_care": {
        "block_id": "info_skin_care",
        "block_name": "Skincare Tips",
        "block_type": "info",
        "entry_trigger": "message",
        "entry_condition": {
          "match": "includes",
          "value": "skincare"
        },
        "canvas": {
          "layout": "vertical",
          "paths": [
            {
              "template_ref": "skin_care_intro",
              "send_immediately": true
            },
            {
              "template_ref": "skin_type_selector",
              "send_immediately": true,
              "next": {
                "template_ref": "skin_type_detail",
                "send_immediately": true,
                "next": {
                  "template_ref": "skin_type_tip",
                  "send_immediately": true
                }
              }
            }
          ]
        }
      }
    }
  },

  "shared_templates": {
    "skin_care_intro": {
      "template_id": "skin_care_intro",
      "template_type": "text",
      "is_active": true,
      "config": {
        "delay_seconds": 0,
        "emoji_style": "minimal",
        "tone": "neutral",
        "show_typing": true
      },
      "locales": {
        "en": {
          "lang": "en",
          "text": "🧴 Our skincare products are gentle, effective, and made for Cambodian skin."
        },
        "kh": {
          "lang": "kh",
          "text": "🧴 ផលិតផលថែសម្រស់របស់យើង សមស្របសម្រាប់ស្បែកខ្មែរ និងមានប្រសិទ្ធភាព។"
        }
      }
    },

    "skin_type_selector": {
      "template_id": "skin_type_selector",
      "template_type": "generic",
      "is_active": true,
      "config": {
        "tone": "neutral"
      },
      "locales": {
        "en": {
          "lang": "en",
          "cards": [
            {
              "title": "Choose your skin type",
              "subtitle": "We'll recommend a routine",
              "options": [
                { "label_en": "Dry Skin", "payload": "dry_skin", "type": "postback" },
                { "label_en": "Oily Skin", "payload": "oily_skin", "type": "postback" }
              ]
            }
          ]
        },
        "kh": {
          "lang": "kh",
          "cards": [
            {
              "title": "ជ្រើសរើសប្រភេទស្បែក",
              "subtitle": "យើងនឹងផ្តល់អនុសាសន៍",
              "options": [
                { "label_kh": "ស្បែកស្ងួត", "payload": "dry_skin", "type": "postback" },
                { "label_kh": "ស្បែកប្រេង", "payload": "oily_skin", "type": "postback" }
              ]
            }
          ]
        }
      }
    },

    "skin_type_detail": {
      "template_id": "skin_type_detail",
      "template_type": "generic",
      "is_active": true,
      "config": {
        "tone": "neutral"
      },
      "locales": {
        "en": {
          "lang": "en",
          "cards": [
            {
              "title": "Dry Skin Routine",
              "subtitle": "Gentle cleanser + hydrating lotion",
              "options": [
                { "label_en": "See Tips", "payload": "show_tips", "type": "postback" }
              ]
            }
          ]
        },
        "kh": {
          "lang": "kh",
          "cards": [
            {
              "title": "របៀបថែស្បែកស្ងួត",
              "subtitle": "សាប៊ូសម្រួល + ឡេបន្ថែមសំណើម",
              "options": [
                { "label_kh": "មើលអនុសាសន៍", "payload": "show_tips", "type": "postback" }
              ]
            }
          ]
        }
      }
    },

    "skin_type_tip": {
      "template_id": "skin_type_tip",
      "template_type": "text",
      "is_active": true,
      "config": {
        "delay_seconds": 1,
        "emoji_style": "minimal",
        "tone": "friendly",
        "show_typing": true
      },
      "locales": {
        "en": {
          "lang": "en",
          "text": "💡 Tip: Apply lotion while skin is still damp to lock in moisture."
        },
        "kh": {
          "lang": "kh",
          "text": "💡 អនុសាសន៍៖ លាបឡេនៅពេលស្បែកនៅសើម ដើម្បីរក្សាសំណើម។"
        }
      }
    }
  },

  "is_draft": true,
  "last_saved_at": "2025-11-07T13:28:00Z",
  "saved_by": "admin001"
}


{
  feature_blocks_by_type: {
    info: {
      xIXPWjxRAtW-kjMLIFtRN: {
        block_id: "xIXPWjxRAtW-kjMLIFtRN",
        block_name: "skin_care",
        block_type: "info",
        entry_trigger: "message",
        entry_condition: { match: "includes", value: "hello" },
        canvas: {
          layout: "vertical",
          paths: [
            {
              template_ref: "s9821_jIn1_terKfmEH13",
              send_immediately: true,
              trigger: "immediate",
              condition: { match: "includes", value: "" }
            }
          ]
        },
        debug: { ... }
      }
    }
  },
  shared_templates: {
    s9821_jIn1_terKfmEH13: {
      template_id: "s9821_jIn1_terKfmEH13",
      template_type: "text",
      is_active: true,
      config: {
        delay_seconds: 0,
        emoji_style: "minimal",
        tone: "neutral",
        show_typing: true
      },
      locales: {
        en: {
          lang: "en",
          text: "🧴 Our skincare products are gentle, effective, and made for Cambodian skin."
        },
        kh: {
          lang: "kh",
          text: "🧴 ផលិតផលថែសម្រស់របស់យើង សមស្របសម្រាប់ស្បែកខ្មែរ និងមានប្រសិទ្ធភាព។"
        }
      }
    }
  },
  is_draft: true,
  last_saved_at: "...",
  saved_by: "admin001"
}


{
  block_id: "welcome_info",
  block_name: "Welcome Info",
  block_type: "generic-template",
  is_active: true,
  messenger_delivery_type: "generic-template",
  entry_trigger: "message",
  entry_condition: { match: "includes", value: "" },
  entry_detection_mode: "keyword",
  expected_intent: "",
  canvas: {
    layout: "vertical",
    paths: [
      {
        template_ref: "ePFDKTStPqCziSnh4j9qb_en",
        send_immediately: true,
        trigger: null,
        condition: null
      }
    ]
  },
  debug: {
    original_block_id: "node_123",
    template_node_map: {
      ePFDKTStPqCziSnh4j9qb_en: "ePFDKTStPqCziSnh4j9qb_en"
    },
    delivery_path_count: 1,
    raw_canvas_paths: [
      {
        template_ref: "ePFDKTStPqCziSnh4j9qb_en",
        next: null,
        send_immediately: true
      }
    ],
    layout_used: "vertical",
    messenger_delivery_type: "generic-template",
    path_status_summary: [
      {
        buttonId: "ePFDKTStPqCziSnh4j9qb_en",
        order: 0,
        valid: true,
        error: null,
        targetNodeId: "ePFDKTStPqCziSnh4j9qb_en",
        is_active: true,
        cardPreview: null
      }
    ],
    message_preview: {
      message_en: null,
      message_kh: null
    }
  }
}


{
  template_id: "ePFDKTStPqCziSnh4j9qb_en",
  template_type: "generic-template",
  is_active: true,
  config: {
    delay_seconds: 1,
    emoji_style: "minimal",
    tone: "neutral",
    show_typing: true
  },
  locales: {
    en: {
      lang: "en",
      cards: [
        {
          title: "Welcome to KhmerAi.Chat!",
          subtitle: "Choose an option below",
          image_url: "https://example.com/welcome.jpg",
          buttons: [
            { type: "postback", title: "Get Started", payload: "GET_STARTED" }
          ]
        }
      ]
    },
    kh: {
      lang: "kh",
      cards: [
        {
          title: "សូមស្វាគមន៍មកកាន់ KhmerAi.Chat!",
          subtitle: "សូមជ្រើសរើសជម្រើសខាងក្រោម",
          image_url: "https://example.com/welcome.jpg",
          buttons: [
            { type: "postback", title: "ចាប់ផ្តើម", payload: "GET_STARTED" }
          ]
        }
      ]
    }
  }
}

{
  "feature_blocks_by_type": {
    "info": {
      "welcome_info": {
        "block_id": "welcome_info",
        "block_name": "Welcome Info",
        "block_type": "generic-template",
        "is_active": true,
        "messenger_delivery_type": "generic-template",
        "entry_trigger": "message",
        "entry_condition": { "match": "includes", "value": "" },
        "entry_detection_mode": "keyword",
        "expected_intent": "",
        "canvas": {
          "layout": "vertical",
          "paths": [
            {
              "template_ref": "template_abc",
              "send_immediately": true
            }
          ]
        },
        "debug": {
          "messenger_delivery_type": "generic-template",
          "message_preview": { "message_en": null, "message_kh": null },
          "template_node_map": {
            "template_abc": "template_abc"
          },
          "delivery_path_count": 1,
          "layout_used": "vertical",
          "raw_canvas_paths": [/*...*/],
          "path_status_summary": [/*...*/]
        }
      }
    }
  },
  "shared_templates": {
    "template_abc": {
      "template_id": "template_abc",
      "template_type": "generic-template",
      "is_active": true,
      "config": {
        "delay_seconds": 0,
        "emoji_style": "minimal",
        "tone": "neutral",
        "show_typing": true
      },
      "locales": {
        "en": {
          "lang": "en",
          "cards": [
            {
              "title": "Choose an option",
              "buttons": [
                {
                  "type": "postback",
                  "title": "More Info",
                  "payload": "template_xyz"  // 🔗 deep link to text-message
                }
              ]
            }
          ]
        },
        "kh": {
          "lang": "kh",
          "cards": [
            {
              "title": "ជ្រើសរើសជម្រើស",
              "buttons": [
                {
                  "type": "postback",
                  "title": "ព័ត៌មានបន្ថែម",
                  "payload": "template_xyz"
                }
              ]
            }
          ]
        }
      }
    },
    "template_xyz": {
      "template_id": "template_xyz",
      "template_type": "text-message",
      "is_active": true,
      "config": {
        "delay_seconds": 0,
        "emoji_style": "minimal",
        "tone": "neutral",
        "show_typing": true
      },
      "locales": {
        "en": {
          "lang": "en",
          "text": "Here’s more information about our service."
        },
        "kh": {
          "lang": "kh",
          "text": "នេះជាព័ត៌មានបន្ថែមអំពីសេវាកម្មរបស់យើង។"
        }
      }
    }
  }
}
