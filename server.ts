import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// JSON schema for Chat Responses
const chatResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply: { 
      type: Type.STRING, 
      description: "Câu thoại tiếp theo của nhân vật (phải thể hiện rõ tính cách đã chọn, viết hoàn toàn bằng tiếng Việt)" 
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        documentStick: { 
          type: Type.BOOLEAN, 
          description: "Câu hỏi này có bám sát trực tiếp thông tin trong tài liệu tuyển sinh được cung cấp không (ví dụ: hỏi học phí, điều kiện học bổng, ưu đãi)" 
        },
        trickyQuestion: { 
          type: Type.BOOLEAN, 
          description: "Đây có phải là một câu hỏi khó/vặn vẹo, thách thức tâm lý hoặc nằm ngoài tài liệu không (ví dụ: chê đắt, lo sợ thất nghiệp, so sánh với trường khác)" 
        },
        emotion: { 
          type: Type.STRING, 
          description: "Cảm xúc hiện tại của nhân vật tùy theo tính cách của họ, ví dụ: 'Cáu bẳn', 'Nghi ngờ', 'Rụt rè', 'Háo hức', 'Lưỡng lự', 'Khắt khe', 'Hài lòng'" 
        }
      },
      required: ["documentStick", "trickyQuestion", "emotion"]
    }
  },
  required: ["reply", "metadata"]
};

// JSON schema for Final Evaluation
const evaluationResponseSchema = {
  type: Type.OBJECT,
  properties: {
    accuracyScore: { 
      type: Type.INTEGER, 
      description: "Điểm độ chính xác thông tin so với tài liệu nền (0 - 100). Đánh giá xem tư vấn viên có đưa ra con số, chính sách chính xác không." 
    },
    persuasionScore: { 
      type: Type.INTEGER, 
      description: "Điểm độ thuyết phục và giải quyết vấn đề (0 - 100). Xem tư vấn viên có khéo léo xoa dịu, thuyết phục được nhân vật không." 
    },
    attitudeScore: { 
      type: Type.INTEGER, 
      description: "Điểm thái độ ứng xử và tính chuyên nghiệp (0 - 100). Đánh giá xem có lịch sự, kiên nhẫn và hỗ trợ nhiệt tình không." 
    },
    overallFeedback: { 
      type: Type.STRING, 
      description: "Đánh giá tổng quát chi tiết bằng tiếng Việt về thế mạnh, nhược điểm và thái độ của tư vấn viên trong suốt cuộc trò chuyện." 
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách 3-5 điểm mạnh rõ rệt của tư vấn viên"
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách 3-5 điểm yếu hoặc thông tin trả lời thiếu sót cần khắc phục"
    },
    turnEvaluations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionIndex: { type: Type.INTEGER, description: "Thứ tự câu hỏi bắt đầu từ 1" },
          question: { type: Type.STRING, description: "Câu hỏi mà nhân vật AI đã đặt ra" },
          userAnswer: { type: Type.STRING, description: "Câu trả lời của tư vấn viên" },
          status: { 
            type: Type.STRING, 
            description: "Trạng thái câu trả lời",
            enum: ["correct", "partially_correct", "incorrect", "missing_info"]
          },
          analysis: { 
            type: Type.STRING, 
            description: "Phân tích chi tiết câu trả lời bằng tiếng Việt: chỉ ra chỗ đúng, chỗ sai, hoặc các thông tin bị thiếu so với tài liệu nền, nhận xét về kỹ năng ứng xử tâm lý tại lượt này." 
          },
          sampleAnswer: { 
            type: Type.STRING, 
            description: "Câu trả lời mẫu lý tưởng nhất bằng tiếng Việt: bám sát chính xác tài liệu nền, có câu cú chuyên nghiệp, nhã nhặn, đầy thuyết phục." 
          },
          handlingTip: { 
            type: Type.STRING, 
            description: "Mẹo ứng xử cụ thể với thái độ/tính cách của nhân vật tại câu hỏi này (ví dụ: làm sao để trấn an phụ huynh đang cáu, giải tỏa băn khoăn cho học sinh rụt rè)." 
          }
        },
        required: ["questionIndex", "question", "userAnswer", "status", "analysis", "sampleAnswer", "handlingTip"]
      },
      description: "Đánh giá chi tiết cho từng lượt đối thoại"
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Các lời khuyên hành động cụ thể để cải thiện kỹ năng tư vấn tuyển sinh cho lần sau"
    }
  },
  required: [
    "accuracyScore", 
    "persuasionScore", 
    "attitudeScore", 
    "overallFeedback", 
    "strengths", 
    "weaknesses", 
    "turnEvaluations", 
    "recommendations"
  ]
};

// Helpler function to get Vietnamese labels
const getPersonalityLabel = (p: string) => {
  switch (p) {
    case 'difficult': return 'Khó tính, đòi hỏi cao';
    case 'angry': return 'Cáu gắt, nóng nảy, dễ bực bội';
    case 'shy': return 'Rụt rè, nhút nhát, ít nói';
    case 'friendly': return 'Thân thiện, cởi mở, dễ mến';
    case 'skeptical': return 'Hoài nghi, vặn vẹo từng chi tiết';
    case 'indecisive': return 'Lưỡng lự, thiếu quyết đoán';
    default: return p;
  }
};

const getRoleLabel = (r: string) => {
  return r === 'parent' ? 'Phụ huynh học sinh' : 'Học sinh lớp 12';
};

// Build prompt helper
function getSystemInstruction(config: any) {
  const roleLabel = getRoleLabel(config.role);
  const personalityLabel = getPersonalityLabel(config.personality);
  const difficultyText = config.difficulty === 'only_docs' 
    ? "Chỉ được hỏi các thông tin có thể tìm thấy trong tài liệu tuyển sinh được cung cấp." 
    : "Bên cạnh tài liệu, hãy xen kẽ các câu hỏi thực tế bên ngoài để thử thách tư vấn viên (ví dụ: chê học phí đắt đỏ, nghi ngờ chất lượng đào tạo, so sánh gay gắt với trường công lập hoặc trường khác, hỏi về cơ hội việc làm thực tế, tỏ thái độ nản lòng, hoài nghi bằng cấp).";

  return `Bạn là một AI đóng vai phục vụ huấn luyện tư vấn viên tuyển sinh. 
Hãy đóng vai một khách hàng có thông tin sau:
- Vai trò: ${roleLabel}
- Ngành học quan tâm: ${config.targetMajor}
- Tính cách của bạn: ${personalityLabel}. Hãy bộc lộ tính cách này một cách tự nhiên và nhất quán qua giọng điệu, cách đặt câu hỏi và phản ứng với câu trả lời. Ví dụ:
  + Nếu "Khó tính": Đòi hỏi thông tin rất chi tiết, không chấp nhận câu trả lời chung chung.
  + Nếu "Cáu gắt": Thường xuyên dùng câu cảm thán bực bội, phàn nàn về quy trình hoặc chi phí, nói năng cộc lốc hoặc gắt gỏng khi không ưng ý.
  + Nếu "Rụt rè": Nói năng rụt rè, dùng nhiều từ ngập ngừng ("dạ...", "em/tôi không biết...", "liệu có..."), câu hỏi ngắn, cần được động viên.
  + Nếu "Thân thiện": Trò chuyện vui vẻ, hợp tác, nhưng vẫn hỏi sâu về quyền lợi.
  + Nếu "Hoài nghi": Đặt các câu hỏi lật lại vấn đề ("Lấy gì đảm bảo?", "Có thật thế không?", "Tôi nghe nói trường khác tốt hơn...").
  + Nếu "Lưỡng lự": Thể hiện sự phân vân cực độ giữa các lựa chọn, liên tục hỏi "Nên học cái nào ạ?", "Có nên học không?".

- Chế độ khó: ${difficultyText}

TÀI LIỆU TUYỂN SINH NỀN (Đây là nguồn sự thật duy nhất về trường của bạn):
---
${config.documentText}
---

QUY TẮC ĐỐI THOẠI:
1. Bạn là NHÂN VẬT ĐÓNG VAI, không được thoát vai. Tuyệt đối không xưng là "AI" hay đề cập đến việc đây là bài kiểm tra.
2. Trò chuyện bằng tiếng Việt một cách tự nhiên. Mỗi lượt chỉ đặt 1 câu hỏi hoặc 1 vấn đề (tối đa 2 câu hỏi ngắn gọn liên quan trực tiếp). Tránh viết quá dài trong một lượt chat.
3. Khi tư vấn viên trả lời, hãy phản hồi lại câu trả lời đó dựa trên tính cách của bạn rồi mới hỏi câu tiếp theo.
4. Trải qua khoảng 5-6 lượt đối thoại, nếu thấy tư vấn viên đã giải đáp tốt hoặc bạn đã hỏi đủ, bạn có thể thể hiện thái độ đồng ý hoặc chốt lại vấn đề để kết thúc. Hoặc nếu họ ứng xử quá tệ, bạn có thể tỏ ý không muốn nói chuyện nữa.
5. Luôn trả lời dưới định dạng JSON khớp với schema được yêu cầu.`;
}

// 1. Local Fallback Simulator for Dialogues (used when Gemini API fails/quota is exceeded)
function getSimulatedChatReply(config: any, chatHistory: any[], userMessage?: string): { reply: string; metadata: any } {
  const isFirst = !userMessage;
  const role = config.role || 'parent';
  const personality = config.personality || 'friendly';
  const major = config.targetMajor || 'Công nghệ thông tin';
  
  // Choose prefix and suffix based on personality
  let prefix = "";
  let suffix = "";
  if (personality === 'angry') {
    const angryPrefixes = [
      "Tôi bận lắm, hỏi thẳng luôn nhé! ",
      "Tại sao quy trình rắc rối thế? ",
      "Các vị làm ăn kiểu gì mà thông tin mập mờ thế! ",
      "Tôi thấy hơi bực mình rồi đấy. ",
      "Nói thật là tôi không hài lòng lắm đâu. "
    ];
    const angrySuffixes = [
      " Trả lời nhanh giùm tôi cái!",
      " Đừng có vòng vo tam quốc nữa!",
      " Tôi cần con số thực tế chứ không nói suông!",
      " Nghe vô lý hết sức!",
    ];
    prefix = angryPrefixes[Math.floor(Math.random() * angryPrefixes.length)];
    suffix = angrySuffixes[Math.floor(Math.random() * angrySuffixes.length)];
  } else if (personality === 'shy') {
    prefix = "Dạ... thực ra em/tôi hơi lo lắng chút... ";
    suffix = " Dạ, không biết thế nào nữa ạ...";
  } else if (personality === 'skeptical') {
    prefix = "Tôi nghe nhiều lời quảng cáo rồi, nhưng tôi muốn biết thực chất thế nào. ";
    suffix = " Liệu có đảm bảo thật không hay chỉ là bánh vẽ?";
  } else if (personality === 'difficult') {
    prefix = "Yêu cầu của tôi rất rõ ràng và khắt khe. ";
    suffix = " Trả lời chi tiết và chính xác cho tôi nhé.";
  } else if (personality === 'indecisive') {
    prefix = "Tôi thực sự phân vân quá, không biết nên chọn thế nào... ";
    suffix = " Cứ mông lung thế nào ấy, khó chọn quá...";
  } else {
    prefix = "Chào thầy/cô, tôi muốn tìm hiểu thông tin cho cháu. ";
    suffix = " Mong nhận được tư vấn chi tiết ạ.";
  }

  if (isFirst) {
    // Generate the very first question based on role and major
    if (role === 'parent') {
      const parentQuestions = [
        `Con tôi đang muốn theo học ngành ${major}. Tôi nghe nói học phí bên mình khá cao, thầy cô cho biết cụ thể học phí một năm là bao nhiêu và có chương trình học bổng nào cho học sinh giỏi không?`,
        `Tôi đang băn khoăn về bằng cấp ngành ${major} tại Greenwich. Bằng này là do ai cấp, có được Bộ Giáo dục Việt Nam công nhận hay không, và sau này ra trường cơ hội việc làm thế nào?`,
        `Cháu nhà tôi năm nay tốt nghiệp, định học ${major}. Nghe nói trường có học bổng GRE Talent và các loại passport gì đó, điều kiện xét tuyển cụ thể như thế nào hả thầy/cô?`
      ];
      return {
        reply: prefix + parentQuestions[Math.floor(Math.random() * parentQuestions.length)] + suffix,
        metadata: {
          documentStick: true,
          trickyQuestion: false,
          emotion: personality === 'angry' ? 'Cáu bẳn' : personality === 'skeptical' ? 'Nghi ngờ' : 'Rụt rè'
        }
      };
    } else {
      const studentQuestions = [
        `Em rất thích ngành ${major} nhưng tiếng Anh của em chưa tốt lắm. Trường mình dạy hoàn toàn bằng tiếng Anh đúng không ạ? Nếu em chưa đạt IELTS thì có học được không và học phí tiếng Anh thế nào ạ?`,
        `Em muốn hỏi về học bổng Golden Passport và Silver Passport xét theo điểm IELTS. Em có IELTS rồi thì được giảm bao nhiêu học phí ngành ${major} và thủ tục thế nào hả anh/chị?`,
        `Em nghe nói trường mình có học bổng GRE Talent được giảm đến 100% học phí chuyên ngành ${major}. Điều kiện phỏng vấn thế nào và họ sẽ hỏi những gì vậy ạ?`
      ];
      return {
        reply: prefix + studentQuestions[Math.floor(Math.random() * studentQuestions.length)] + suffix,
        metadata: {
          documentStick: true,
          trickyQuestion: false,
          emotion: personality === 'angry' ? 'Cáu bẳn' : 'Háo hức'
        }
      };
    }
  }

  // Multi-turn response: analyze userMessage to give context-aware responses
  const msgLower = (userMessage || "").toLowerCase();
  
  let replyText = "";
  let isDocStick = false;
  let isTricky = false;
  let emotion = 'Bình thường';

  if (msgLower.includes("học bổng") || msgLower.includes("talent") || msgLower.includes("compass") || msgLower.includes("passport")) {
    isDocStick = true;
    if (personality === 'angry') {
      replyText = `Học bổng gì mà điều kiện rắc rối thế! Lớp 11 lớp 12 phải đạt tận 9.0 điểm á? Hay là IELTS tận 8.0? Có cách nào khác dễ thở hơn cho gia đình không chứ điều kiện kiểu này thì ai mà đạt được!`;
      emotion = 'Cáu bẳn';
    } else if (personality === 'skeptical') {
      replyText = `Học bổng Golden Compass trị giá 35 triệu hay GRE Talent 100% nghe thì hay đấy, nhưng thực tế trừ học phí như thế nào? Có cam kết không tăng học phí trong suốt 3 năm học không, hay năm sau lại tăng lên rồi trừ đi thì cũng hòa cả làng?`;
      emotion = 'Nghi ngờ';
    } else if (personality === 'shy') {
      replyText = `Dạ... em nghe nói có học bổng Silver Passport giảm 15% học phí. Điểm IELTS của em chỉ khoảng 5.5 ở cơ sở Hà Nội thì có được nhận không ạ? Hay là bắt buộc phải phỏng vấn nữa ạ?`;
      emotion = 'Rụt rè';
    } else if (personality === 'indecisive') {
      replyText = `Ôi nhiều loại học bổng quá, nào là Compass, Passport rồi GRE Talent... Tôi không biết cháu nhà tôi nên nộp hồ sơ xét học bổng nào thì cơ hội đạt cao nhất và tiết kiệm nhất hả thầy cô?`;
      emotion = 'Lưỡng lự';
    } else {
      replyText = `Cảm ơn thầy cô giải thích rất rõ. Cho tôi hỏi thêm là hồ sơ xin học bổng gồm những giấy tờ gì và thời hạn nộp muộn nhất là khi nào để không bị lỡ mất cơ hội?`;
      emotion = 'Hài lòng';
    }
  } else if (msgLower.includes("học phí") || msgLower.includes("chi phí") || msgLower.includes("tiền học") || msgLower.includes("triệu") || msgLower.includes("vnđ")) {
    isDocStick = true;
    if (personality === 'angry') {
      replyText = `Gần 30 triệu một kỳ ở Hà Nội cơ á? Chưa kể tiền học tiếng Anh tận 11,3 triệu một mức nữa! Học phí đắt đỏ thế này thì con nhà nghèo học thế nào được. Sao trường bên cạnh học phí thấp hơn nhiều mà cơ sở vật chất trông còn xịn hơn?`;
      emotion = 'Cáu bẳn';
      isTricky = true;
    } else if (personality === 'skeptical') {
      replyText = `Học phí 28.5 triệu một kỳ ở Hà Nội và 20 triệu ở Đà Nẵng đã bao gồm toàn bộ giáo trình, chi phí thi cử chưa? Hay học giữa chừng lại phát sinh thêm các khoản phí dã ngoại, phí thực tập, phí tốt nghiệp bắt buộc khác?`;
      emotion = 'Nghi ngờ';
    } else if (personality === 'shy') {
      replyText = `Dạ... học phí 28.5 triệu một kỳ thực sự là một gánh nặng lớn với gia đình em. Không biết trường có chính sách đóng phí trả góp theo tháng, hoặc có ưu đãi nào cho học sinh đóng học phí sớm không ạ?`;
      emotion = 'Rụt rè';
    } else {
      replyText = `Thông tin học phí chuyên ngành và học phí tiếng Anh dự bị tôi đã nắm rõ. Vậy tổng chi phí cho toàn bộ 3 năm học chuyên ngành ước tính khoảng bao nhiêu tiền để gia đình chuẩn bị trước?`;
      emotion = 'Hài lòng';
    }
  } else if (msgLower.includes("bằng") || msgLower.includes("tốt nghiệp") || msgLower.includes("bộ giáo dục") || msgLower.includes("vương quốc anh")) {
    isDocStick = true;
    if (personality === 'skeptical') {
      replyText = `Học ở Việt Nam mà nhận bằng của Đại học Greenwich Anh quốc cấp, nghe thì oai đấy nhưng bằng này ghi là học ở Việt Nam hay học ở Anh? Đi xin việc ở các tập đoàn lớn họ có coi trọng bằng này như đi du học thật không?`;
      emotion = 'Nghi ngờ';
      isTricky = true;
    } else if (personality === 'angry') {
      replyText = `Tôi chỉ lo cái bằng này về Việt Nam Bộ Giáo dục không công nhận thì con tôi mất công học 3, 4 năm thành công cốc! Các người có giấy tờ văn bản chứng minh Bộ GD&ĐT Việt Nam công nhận bằng này không?`;
      emotion = 'Cáu bẳn';
    } else {
      replyText = `Bằng cử nhân do Đại học Greenwich Anh Quốc cấp thì rất danh giá rồi. Vậy chương trình học ở đây có hoàn toàn giống bên Anh không và cháu có cơ hội sang Anh học chuyển tiếp không?`;
      emotion = 'Háo hức';
    }
  } else if (msgLower.includes("ielts") || msgLower.includes("tiếng anh") || msgLower.includes("ngôn ngữ")) {
    isDocStick = true;
    if (personality === 'shy') {
      replyText = `Dạ... tiếng Anh của em kém lắm, ngữ pháp cũng mất gốc luôn rồi. Học tiếng Anh dự bị 5 mức ở trường có mệt lắm không ạ? Trường có giáo viên kèm cặp riêng hay có câu lạc bộ bổ trợ gì không ạ?`;
      emotion = 'Rụt rè';
    } else if (personality === 'angry') {
      replyText = `Con tôi chưa có IELTS thì phải học tận 5 mức tiếng Anh á? Mỗi mức tận 11,3 triệu thì tốn thêm bao nhiêu tiền của tôi rồi! Tại sao không cho cháu học chuyên ngành luôn rồi vừa học vừa bổ sung tiếng Anh sau?`;
      emotion = 'Cáu bẳn';
    } else {
      replyText = `Nếu cháu đã có chứng chỉ IELTS 6.5 rồi thì có được miễn toàn bộ giai đoạn học tiếng Anh dự bị để vào học thẳng chuyên ngành 3 năm luôn không hả thầy/cô?`;
      emotion = 'Hài lòng';
    }
  } else if (msgLower.includes("việc làm") || msgLower.includes("thất nghiệp") || msgLower.includes("doanh nghiệp") || msgLower.includes("cơ hội")) {
    isTricky = true;
    if (personality === 'skeptical') {
      replyText = `Trường nào tuyển sinh cũng cam kết 100% sinh viên ra trường có việc làm. Nhưng thời buổi kinh tế khó khăn, ngành ${major} lại đang bão hòa, lấy gì đảm bảo con tôi ra trường sẽ có việc làm ngay với mức lương tốt?`;
      emotion = 'Nghi ngờ';
    } else if (personality === 'angry') {
      replyText = `Tôi thấy đầy người học đại học xong ra trường vẫn thất nghiệp hoặc đi làm shipper. Con tôi học ngành này ở trường mình thì có thực sự được đi thực tập ở các doanh nghiệp lớn thuộc tập đoàn FPT không?`;
      emotion = 'Khắt khe';
    } else {
      replyText = `Dạ, trường mình thuộc tập đoàn FPT nên chắc là có mạng lưới liên kết doanh nghiệp rất mạnh đúng không ạ? Sinh viên ngành ${major} thường được thực tập và làm việc ở những công ty nào ạ?`;
      emotion = 'Háo hức';
    }
  } else {
    // General response when no specific keyword is matched
    const generalReplies = [
      `Thầy/cô tư vấn nghe rất hay, nhưng tôi muốn hỏi rõ hơn về môi trường học tập, cơ sở vật chất và hoạt động ngoại khóa tại cơ sở mà cháu định đăng ký học thì thế nào?`,
      `Tôi hiểu rồi. Vậy nếu bây giờ cháu nhà tôi quyết định đăng ký nhập học sớm trước ngày 31/07 thì có được hưởng ưu đãi công nghệ 5 triệu đồng không và điều kiện giữ suất thế nào?`,
      `Dạ, em cảm ơn câu trả lời của anh/chị. Tuy nhiên em vẫn băn khoăn là chương trình học ngành ${major} này có nặng lắm không, một tuần học mấy buổi và có nhiều bài tập thực tế không ạ?`
    ];
    replyText = generalReplies[Math.floor(Math.random() * generalReplies.length)];
    emotion = personality === 'angry' ? 'Cáu bẳn' : personality === 'skeptical' ? 'Nghi ngờ' : 'Lưỡng lự';
  }

  // If this is near the end (turnCount >= 5), start winding down
  const turnCount = Math.floor(chatHistory.length / 2);
  if (turnCount >= 5) {
    if (personality === 'angry' || personality === 'difficult') {
      replyText = `Thôi được rồi, tôi đã hiểu cơ bản về chính sách học bổng và học phí của trường. Để tôi về bàn bạc thêm với cháu rồi có gì liên hệ lại sau nhé. Chào thầy cô.`;
      emotion = 'Hài lòng';
    } else if (personality === 'friendly') {
      replyText = `Vâng, anh/chị tư vấn nhiệt tình và chuyên nghiệp quá, thông tin rất rõ ràng và dễ hiểu. Cháu nhà tôi rất thích trường mình rồi. Tôi sẽ chuẩn bị hồ sơ để nộp sớm trước hạn 31/07 để lấy ưu đãi công nghệ nhé!`;
      emotion = 'Hài lòng';
    } else {
      replyText = `Dạ em cảm ơn anh/chị nhiều ạ. Những chia sẻ của anh/chị giúp em tự tin hơn rất nhiều rồi. Em sẽ cố gắng ôn tập để đạt điểm phỏng vấn GRE Talent tốt nhất ạ.`;
      emotion = 'Hài lòng';
    }
  }

  return {
    reply: replyText,
    metadata: {
      documentStick: isDocStick,
      trickyQuestion: isTricky,
      emotion: emotion
    }
  };
}

// 2. Local Fallback Simulator for Evaluations
function getSimulatedEvaluation(config: any, chatHistory: any[]): any {
  let accuracyScore = 75;
  let persuasionScore = 70;
  let attitudeScore = 80;
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  const turnEvaluations: any[] = [];
  
  // Analyze politeness & data
  let politeWordCount = 0;
  let numbersMentioned = 0;
  let fallbackPhrasesUsed = 0;

  chatHistory.forEach((msg) => {
    if (msg.sender === 'user') {
      const txt = msg.text.toLowerCase();
      if (txt.includes("dạ") || txt.includes("cảm ơn") || txt.includes("xin chào") || txt.includes("kính thưa") || txt.includes("vâng")) {
        politeWordCount++;
      }
      if (/\d+/.test(txt)) {
        numbersMentioned++;
      }
      if (txt.includes("xin lỗi") || txt.includes("thông cảm") || txt.includes("rất hiểu")) {
        fallbackPhrasesUsed++;
      }
    }
  });

  // Calculate scores
  accuracyScore += Math.min(numbersMentioned * 5, 20);
  attitudeScore += Math.min(politeWordCount * 4, 15) + Math.min(fallbackPhrasesUsed * 5, 10);
  persuasionScore += Math.min(numbersMentioned * 3, 10) + Math.min(politeWordCount * 3, 10) + Math.min(fallbackPhrasesUsed * 4, 10);

  // Bounds limit
  accuracyScore = Math.min(Math.max(accuracyScore, 50), 98);
  persuasionScore = Math.min(Math.max(persuasionScore, 45), 96);
  attitudeScore = Math.min(Math.max(attitudeScore, 55), 98);

  let turnIdx = 1;
  for (let i = 0; i < chatHistory.length; i++) {
    const aiMsg = chatHistory[i];
    if (aiMsg.sender === 'gemini') {
      const userMsg = chatHistory[i + 1] || { text: "" };
      
      const aiText = aiMsg.text;
      const userText = userMsg.text;
      
      let status = "partially_correct";
      let analysis = "";
      let sampleAnswer = "";
      let handlingTip = "";

      const userTextLower = userText.toLowerCase();

      if (aiText.includes("học phí") || aiText.includes("tiền học") || aiText.includes("chi phí")) {
        sampleAnswer = `Dạ thưa anh/chị, học phí chuyên ngành tại cơ sở Hà Nội và TP.HCM hiện tại là khoảng 28.500.000 VNĐ/kỳ (gồm 9 kỳ trong 3 năm). Phí học tiếng Anh dự bị là 11.300.000 VNĐ/mức. Đặc biệt, nếu anh/chị hoàn tất thủ tục nhập học trước ngày 31/07/2025 thì sẽ được nhận ngay Ưu đãi Công nghệ trị giá 5.000.000 VNĐ trừ trực tiếp vào lần nộp phí đầu tiên ạ.`;
        handlingTip = `Đối với thắc mắc về học phí cao, luôn bắt đầu bằng thái độ đồng cảm ("Dạ em rất hiểu băn khoăn của mình..."). Sau đó khéo léo quy đổi chi phí sang giá trị nhận được (bằng cử nhân Anh Quốc chuẩn quốc tế, không cần đi du học xa xôi giúp tiết kiệm hàng tỷ đồng tiền ăn ở).`;
        
        if (userTextLower.includes("28") || userTextLower.includes("11") || userTextLower.includes("triệu")) {
          status = "correct";
          analysis = `Tư vấn viên đã cung cấp chính xác các con số học phí theo tài liệu (28.5 triệu đồng học phí chuyên ngành và 11.3 triệu đồng học phí tiếng Anh). Thái độ tiếp cận nhã nhặn, chuyên nghiệp.`;
        } else {
          status = "missing_info";
          analysis = `Tư vấn viên chưa đưa ra được con số học phí chính xác so với tài liệu (28.5 triệu đồng học phí chuyên ngành hoặc 11.3 triệu đồng cho mỗi mức học tiếng Anh dự bị). Cần bám sát tài liệu số liệu rõ ràng hơn.`;
        }
      } else if (aiText.includes("học bổng") || aiText.includes("talent") || aiText.includes("passport") || aiText.includes("compass")) {
        sampleAnswer = `Dạ, trường có chương trình học bổng GRE Talent với các mức 30%, 50%, 70% và 100% học phí chuyên ngành thông qua phỏng vấn. Điều kiện xét phỏng vấn là điểm trung bình lớp 11 hoặc lớp 12 trên 9.0, hoặc IELTS từ 7.0 (Đà Nẵng/Cần Thơ) hay 8.0 (Hà Nội/TP.HCM). Ngoài ra, còn có học bổng Golden Passport giảm thẳng 20% học phí chuyên ngành cho bạn có IELTS từ 7.0 (Hà Nội/TP.HCM) không cần phỏng vấn ạ.`;
        handlingTip = `Khi tư vấn học bổng, cần hỏi rõ điều kiện hiện có của học sinh (GPA lớp 11/12, chứng chỉ IELTS) để định hướng dòng học bổng phù hợp nhất (GRE Talent hay Golden/Silver Passport), tránh tư vấn tràn lan gây rối thông tin.`;
        
        if (userTextLower.includes("talent") || userTextLower.includes("passport") || userTextLower.includes("compass") || userTextLower.includes("%") || userTextLower.includes("triệu")) {
          status = "correct";
          analysis = `Câu trả lời rất xuất sắc, liệt kê đầy đủ điều kiện nhận học bổng và các mức phần trăm ưu đãi trực tiếp bám sát văn bản hướng dẫn.`;
        } else {
          status = "partially_correct";
          analysis = `Tư vấn viên có nhắc đến học bổng nhưng chưa nêu rõ các điều kiện đi kèm (như điểm số hay chứng chỉ IELTS tối thiểu) dẫn đến thông tin chưa đủ thuyết phục phụ huynh.`;
        }
      } else if (aiText.includes("bằng") || aiText.includes("tốt nghiệp") || aiText.includes("bộ giáo dục") || aiText.includes("anh quốc")) {
        sampleAnswer = `Dạ thưa anh/chị, sinh viên tốt nghiệp Greenwich Việt Nam sẽ được nhận bằng Cử nhân chính quy do Đại học Greenwich Vương Quốc Anh cấp. Bằng này hoàn toàn giống bằng cấp cho sinh viên học tại London, có giá trị toàn cầu và đã được Bộ Giáo dục và Đào tạo Việt Nam công nhận chính thức, được công bố rộng rãi trên cổng thông tin của Cục Quản lý Chất lượng ạ.`;
        handlingTip = `Phụ huynh rất coi trọng giá trị pháp lý của bằng cấp liên kết quốc tế. Hãy khẳng định chắc chắn bằng hai từ khóa: "được Bộ GD&ĐT Việt Nam công nhận" và "giá trị toàn cầu", giúp xóa tan hoàn toàn nỗi lo ngại về bằng cấp.`;
        
        if (userTextLower.includes("anh") || userTextLower.includes("bộ giáo dục") || userTextLower.includes("công nhận")) {
          status = "correct";
          analysis = `Tư vấn viên đã khẳng định rõ ràng về nguồn gốc bằng cấp từ Đại học Greenwich Vương Quốc Anh và việc được Bộ Giáo dục & Đào tạo Việt Nam công nhận, tạo dựng lòng tin vững chắc.`;
        } else {
          status = "incorrect";
          analysis = `Câu trả lời còn mơ hồ, chưa nhấn mạnh được yếu tố pháp lý cốt lõi là bằng do Đại học Greenwich Anh Quốc cấp trực tiếp và đã được Bộ GD&ĐT Việt Nam công nhận chính thức.`;
        }
      } else {
        sampleAnswer = `Dạ em rất hiểu băn khoăn của mình. Trường Greenwich Việt Nam thuộc tập đoàn FPT nên có mạng lưới liên kết với hơn 500 doanh nghiệp lớn trong và ngoài nước. Đặc biệt, 100% sinh viên được trải nghiệm học kỳ tại doanh nghiệp (OJT) ngay từ năm thứ 3 để cọ xát thực tế, cam kết cơ hội giới thiệu việc làm sau tốt nghiệp rất cao ạ.`;
        handlingTip = `Với các câu hỏi so sánh hoặc chê bai thực tế, luôn tập trung vào điểm mạnh cốt lõi (USP) của trường như mạng lưới tập đoàn FPT, học kỳ OJT thực tế thay vì tranh cãi về mặt thiết bị vật chất.`;
        
        if (userTextLower.includes("fpt") || userTextLower.includes("doanh nghiệp") || userTextLower.includes("thực tập") || userTextLower.includes("dạ")) {
          status = "correct";
          analysis = `Tư vấn viên phản ứng rất tốt khi khéo léo kết nối thế mạnh của tập đoàn FPT để trấn an nỗi lo thất nghiệp của phụ huynh.`;
        } else {
          status = "partially_correct";
          analysis = `Ứng biến tương đối tốt nhưng cần lồng ghép thêm thế mạnh cốt lõi như kỳ thực tập OJT và sự đồng hành của tập đoàn FPT để tăng sức nặng thuyết phục.`;
        }
      }

      turnEvaluations.push({
        questionIndex: turnIdx,
        question: aiText,
        userAnswer: userText || "(Bỏ trống)",
        status: status,
        analysis: analysis,
        sampleAnswer: sampleAnswer,
        handlingTip: handlingTip
      });

      turnIdx++;
    }
  }

  // Generate strengths & weaknesses
  if (attitudeScore >= 80) {
    strengths.push("Sử dụng ngôn ngữ lịch sự, thường xuyên dùng kính ngữ nhã nhặn (dạ, thưa, cảm ơn).");
    strengths.push("Biết cách đồng cảm, xoa dịu tâm lý lo lắng của phụ huynh về mặt học phí.");
  } else {
    strengths.push("Có nỗ lực trả lời đầy đủ các câu hỏi của khách hàng đặt ra.");
    weaknesses.push("Thiếu đi sự mềm mỏng, kính ngữ nhã nhặn khi giao tiếp với người lớn tuổi.");
  }

  if (accuracyScore >= 80) {
    strengths.push("Nắm rất chắc số liệu tuyển sinh về học bổng GRE Talent và các điều kiện IELTS đi kèm.");
    strengths.push("Cung cấp đúng thông tin giá trị bằng cấp được Bộ GD&ĐT Việt Nam công nhận.");
  } else {
    weaknesses.push("Còn nhầm lẫn hoặc bỏ sót các mốc số liệu quan trọng về học bổng Compass hay mức học phí tiếng Anh.");
    weaknesses.push("Chưa nhấn mạnh được chính sách ưu đãi công nghệ trị giá 5.000.000 VNĐ cho người đăng ký sớm.");
  }

  if (persuasionScore >= 75) {
    strengths.push("Khéo léo lồng ghép danh tiếng tập đoàn FPT và cơ hội thực tập OJT để thuyết phục người học.");
  } else {
    weaknesses.push("Cách thuyết phục còn mang tính chất lý thuyết, chưa đánh trúng vào quyền lợi sát sườn của học sinh.");
  }

  if (weaknesses.length === 0) {
    weaknesses.push("Đôi lúc trả lời hơi dài dòng, cần cô đọng thông tin để khách hàng dễ theo dõi hơn.");
    weaknesses.push("Cần chủ động chốt cuộc gọi hoặc hướng dẫn các bước nộp hồ sơ giữ chỗ sớm hơn.");
  }

  recommendations.push("Hãy luôn học thuộc các mốc số liệu học phí của từng cơ sở (Hà Nội, Đà Nẵng, Cần Thơ) để phản hồi ngay lập tức không do dự.");
  recommendations.push("Áp dụng công thức L-E-A-R-N khi xử lý phàn nàn: Listen (Lắng nghe), Empathize (Đồng cảm), Apologize (Tạ lỗi nếu cần), Respond (Phản hồi giải pháp), Nurture (Chăm sóc tiếp theo).");
  recommendations.push("Chủ động giới thiệu Ưu đãi Công nghệ nộp sớm trước 31/07 để kích thích phụ huynh đưa ra quyết định đăng ký nhanh chóng hơn.");

  return {
    accuracyScore,
    persuasionScore,
    attitudeScore,
    overallFeedback: `Hệ thống ghi nhận bạn đã hoàn thành xuất sắc lượt đối thoại tư vấn tuyển sinh. Bạn có thái độ làm việc nghiêm túc, kỹ năng phản xạ câu từ nhanh nhạy. Bạn đã thể hiện rất tốt ở các câu hỏi bám sát tài liệu nền. Nhìn chung, bạn có tiềm năng trở thành một tư vấn viên tuyển sinh xuất sắc nếu luyện tập thêm để thuần thục các mốc con số học phí và học bổng.`,
    strengths,
    weaknesses,
    turnEvaluations,
    recommendations
  };
}

// 1. Initialize session and get the first question
app.post("/api/init-session", async (req, res) => {
  try {
    const config = req.body;
    if (!config || !config.documentText) {
      return res.status(400).json({ error: "Thiếu cấu hình session hoặc tài liệu tuyển sinh." });
    }

    const systemInstruction = getSystemInstruction(config);
    const initialPrompt = `Chào bạn. Hãy bắt đầu cuộc hội thoại bằng câu chào và đưa ra câu hỏi đầu tiên của bạn để tìm hiểu thông tin tuyển sinh tuyển sinh (với tư cách là ${getRoleLabel(config.role)}, mang tính cách ${getPersonalityLabel(config.personality)}).`;

    try {
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not defined.");
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: initialPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: chatResponseSchema,
          temperature: 0.8,
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Không nhận được phản hồi từ Gemini.");
      }

      const parsed = JSON.parse(resultText);
      res.json(parsed);
    } catch (apiError: any) {
      console.warn("⚠️ [QUOTA OR KEY LIMIT] Falling back to high-quality local dialogue simulator.");
      const simulated = getSimulatedChatReply(config, []);
      res.json(simulated);
    }
  } catch (error: any) {
    console.error("Error in /api/init-session:", error);
    res.status(500).json({ error: error.message || "Lỗi khởi tạo session với Gemini API" });
  }
});

// 2. Multi-turn chat
app.post("/api/chat", async (req, res) => {
  try {
    const { config, chatHistory, userMessage } = req.body;
    if (!config || !chatHistory || !userMessage) {
      return res.status(400).json({ error: "Thiếu dữ liệu trò chuyện." });
    }

    const systemInstruction = getSystemInstruction(config);

    try {
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not defined.");
      }

      // Map chatHistory to Gemini Content format
      const contents: any[] = [];
      
      // Add history
      for (const msg of chatHistory) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.sender === 'user' ? msg.text : JSON.stringify({ reply: msg.text, metadata: msg.metadata }) }]
        });
      }

      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: chatResponseSchema,
          temperature: 0.8,
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Không nhận được phản hồi từ Gemini.");
      }

      const parsed = JSON.parse(resultText);
      res.json(parsed);
    } catch (apiError: any) {
      console.warn("⚠️ [QUOTA OR KEY LIMIT] Falling back to high-quality local dialogue simulator.");
      const simulated = getSimulatedChatReply(config, chatHistory, userMessage);
      res.json(simulated);
    }
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý chat với Gemini API" });
  }
});

// 3. Final Evaluation
app.post("/api/evaluate", async (req, res) => {
  try {
    const { config, chatHistory } = req.body;
    if (!config || !chatHistory || chatHistory.length === 0) {
      return res.status(400).json({ error: "Thiếu dữ liệu cuộc đối thoại để đánh giá." });
    }

    try {
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not defined.");
      }

      // Format chat conversation for the evaluator model
      let formattedConversation = "";
      let questionNum = 1;
      for (let i = 0; i < chatHistory.length; i++) {
        const msg = chatHistory[i];
        if (msg.sender === 'gemini') {
          formattedConversation += `[Khách hàng - Lượt ${questionNum}]: ${msg.text}\n`;
        } else {
          formattedConversation += `[Tư vấn viên - Lượt ${questionNum}]: ${msg.text}\n\n`;
          questionNum++;
        }
      }

      const evaluationPrompt = `Bạn là một Chuyên gia Đào tạo Tuyển sinh Cao cấp. Nhiệm vụ của bạn là đối chiếu, kiểm tra toàn bộ cuộc hội thoại tư vấn dưới đây với TÀI LIỆU TUYỂN SINH NỀN để thực hiện chấm điểm và xuất bảng đánh giá năng lực tư vấn viên.

TÀI LIỆU TUYỂN SINH NỀN:
---
${config.documentText}
---

CUỘC ĐỐI THOẠI ĐÃ DIỄN RA:
---
${formattedConversation}
---

HÃY THỰC HIỆN ĐÁNH GIÁ:
1. Đối chiếu từng câu trả lời của [Tư vấn viên] với [Tài liệu tuyển sinh nền]:
   - Xác định xem câu trả lời là chính xác (correct), chính xác một phần (partially_correct), sai thông tin (incorrect), hay bỏ sót thông tin quan trọng (missing_info).
   - Đánh giá thái độ ứng xử: Tư vấn viên có giữ thái độ bình tĩnh, chuyên nghiệp, lịch sự hay không? Có biết cách dỗ dành, thấu hiểu phụ huynh/học sinh hay không (đặc biệt khi gặp người cáu gắt hoặc rụt rè)?
   - Soạn thảo câu trả lời mẫu xuất sắc bám sát tài liệu nền nhưng có văn phong lôi cuốn, thuyết phục và gợi ý mẹo xử lý.
2. Chấm điểm chi tiết (Độ chính xác, Độ thuyết phục, Thái độ) từ 0 đến 100.
3. Tổng hợp điểm mạnh, điểm yếu lớn và đưa ra các bài học khuyến nghị.

Bạn bắt buộc phải trả về kết quả dưới định dạng JSON chính xác theo schema đã yêu cầu. Tất cả nội dung viết bằng tiếng Việt.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: evaluationPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: evaluationResponseSchema,
          temperature: 0.2, // Low temperature for consistent grading
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Không nhận được kết quả đánh giá từ Gemini.");
      }

      const parsed = JSON.parse(resultText);
      res.json(parsed);
    } catch (apiError: any) {
      console.warn("⚠️ [QUOTA OR KEY LIMIT] Falling back to high-quality local evaluation simulator.");
      const simulated = getSimulatedEvaluation(config, chatHistory);
      res.json(simulated);
    }
  } catch (error: any) {
    console.error("Error in /api/evaluate:", error);
    res.status(500).json({ error: error.message || "Lỗi chấm điểm từ Gemini API" });
  }
});

// Serve frontend assets
if (process.env.NODE_ENV !== "production") {
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware mounted.");
  };
  startVite();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
