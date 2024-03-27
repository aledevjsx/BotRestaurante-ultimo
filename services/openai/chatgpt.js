import OpenAI from 'openai';

/**
 * 
 * @returns 
 */
const completion = async (dataIn = '') => {
  // const configuration = new Configuration({
  //   apiKey: process.env.OPENAI_API_KEY,
  // });
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
  });
  const response = await openai.chat.completions.create({
    model: "text-davinci-003",
    prompt: dataIn,
    max_tokens: 256,
    temperature: 0,
  });

  return response
}

export default { completion };