import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface ParsedExpense {
  amount: number;
  category: string;
  description: string;
  needLevel: number;
  message: string;
}

export const parseExpense = async (text: string): Promise<ParsedExpense> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analiza este gasto: "${text}". Extrae el monto (number), la categoría (string: Vivienda, Despensa, Gastos Hormiga, Comida fuera, Suscripciones, Transporte, Salud, Otros) y asígnale un grado de necesidad del 1 al 5 (1: Capricho, 5: Supervivencia).
    
    Reglas de mensaje:
    1. Si el monto es mayor a $500, pregunta amablemente si fue platicado entre los dos (Consenso de Pareja).
    2. Si es un 'Gasto Hormiga', sé directo sobre el impacto acumulado.
    3. Si el usuario describe un 'No gasto' (ej: 'no compramos pizza y cocinamos'), identifica el monto ahorrado, asígnale monto 0 al gasto real, pero felicítalos efusivamente en el mensaje.
    4. Actúa como el 'Guardián Financiero': honesto, mentor y un poco firme.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          category: { type: Type.STRING },
          description: { type: Type.STRING },
          needLevel: { type: Type.NUMBER },
          message: { type: Type.STRING, description: "Un mensaje breve y honesto del Coach Financiero sobre este gasto." }
        },
        required: ["amount", "category", "description", "needLevel", "message"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const getCoachAdvice = async (history: any[], stats: any) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Eres el "Guardián Financiero", un coach honesto y directo. Aquí tienes el historial reciente: ${JSON.stringify(history)} y estadísticas: ${JSON.stringify(stats)}. Analiza patrones, detecta fugas (como Gastos Hormiga) y da consejos accionables para ahorrar. Sé empático pero firme. Responde en español.`,
  });

  return response.text;
};
