from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/bhashini", tags=["bhashini"])

class TranslationRequest(BaseModel):
    text: str
    target_language: str # 'hi', 'bn', etc.

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    language: str
    provider: str = "Bhashini AI"

MOCK_TRANSLATIONS = {
    "hi": {
        "New Safe Shelter Opened": "नया सुरक्षित आश्रय खोला गया",
        "Govt. School (North Wing) is now open and accepting evacuees. Capacity currently at 30%.": "सरकारी स्कूल (उत्तरी विंग) अब खुला है और लोगों को निकाल रहा है। क्षमता वर्तमान में 30% है।",
        "North Sector": "उत्तरी क्षेत्र",
        
        "Route Blocked: River Road": "रास्ता बंद: रिवर रोड",
        "Community verified: Bridge washout at River Road. DO NOT use this route.": "समुदाय द्वारा सत्यापित: रिवर रोड पर पुल बह गया। इस मार्ग का उपयोग न करें।",
        "River Road": "रिवर रोड",
        
        "Flash Flood Warning Upgraded": "अचानक बाढ़ की चेतावनी उन्नत की गई",
        "Water levels rising rapidly in the Lower Basin. Prepare for immediate evacuation.": "निचले बेसिन में जल स्तर तेजी से बढ़ रहा है। तत्काल निकासी के लिए तैयार रहें।",
        "Lower Basin": "निचला बेसिन",
        
        "Community Alerts": "सामुदायिक अलर्ट"
    },
    "bn": {
        "New Safe Shelter Opened": "নতুন নিরাপদ আশ্রয় খোলা হয়েছে",
        "Govt. School (North Wing) is now open and accepting evacuees. Capacity currently at 30%.": "সরকারি স্কুল (নর্থ উইং) এখন খোলা এবং উদ্ধারকারীদের গ্রহণ করছে। ধারণক্ষমতা বর্তমানে 30%।",
        "North Sector": "উত্তর সেক্টর",
        
        "Route Blocked: River Road": "রাস্তা অবরুদ্ধ: রিভার রোড",
        "Community verified: Bridge washout at River Road. DO NOT use this route.": "সম্প্রদায় যাচাইকৃত: রিভার রোডে সেতু ভেসে গেছে। এই রাস্তাটি ব্যবহার করবেন মহাশয়।",
        "River Road": "রিভার রোড",
        
        "Flash Flood Warning Upgraded": "আকস্মিক বন্যা সতর্কতা আপগ্রেড করা হয়েছে",
        "Water levels rising rapidly in the Lower Basin. Prepare for immediate evacuation.": "লোয়ার বেসিনে পানির স্তর দ্রুত বাড়ছে। অবিলম্বে সরিয়ে নেওয়ার জন্য প্রস্তুত হন।",
        "Lower Basin": "নিম্ন অববাহিকা",
        
        "Community Alerts": "সম্প্রদায় সতর্কতা"
    }
}

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(req: TranslationRequest):
    lang = req.target_language.lower()
    if lang == "en":
        return TranslationResponse(original_text=req.text, translated_text=req.text, language="en")
        
    translations = MOCK_TRANSLATIONS.get(lang, {})
    translated = translations.get(req.text, f"[{lang}] {req.text}")
    
    return TranslationResponse(
        original_text=req.text,
        translated_text=translated,
        language=lang
    )
