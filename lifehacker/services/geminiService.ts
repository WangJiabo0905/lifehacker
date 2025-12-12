
import { GoogleGenAI, Type } from "@google/genai";
import { DailyPlan } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

export const analyzeDay = async (plan: DailyPlan): Promise<string> => {
  const client = getClient();
  if (!client) return "API Key unavailable. Please check your environment.";

  const completedCount = plan.tasks.filter(t => t.completed).length;
  const totalCount = plan.tasks.length;

  const prompt = `
    你是一位充满智慧的导师，也是一位注重效率的生活教练（类似于乔布斯与王阳明的结合体）。
    请根据以下数据分析我的一天：
    - 日期: ${plan.date}
    - 任务完成情况: ${completedCount}/${totalCount}
    - 我的复盘: "${plan.review}"
    - 我的今日收获: "${plan.harvest}"

    请提供一段简练、有力且深刻的评语（100字以内）。
    1. 总结我的状态。
    2. 对我的"收获"进行点评或升华。
    3. 为明天提供一条具体的行动建议。
    请用中文回答，语气要诚恳、直接、富有启发性。
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "无法生成洞察。";
  } catch (error) {
    console.error("Gemini Error", error);
    return "导师此刻保持沉默 (连接AI失败)。";
  }
};
