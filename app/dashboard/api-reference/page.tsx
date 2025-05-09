"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ApiReferencePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('prompt');

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copied',
      description: 'The code snippet has been copied to your clipboard.',
    });
  };

  const basicEndpoint = '/api/translate/basic';
  const advancedEndpoint = '/api/translate/advanced';
  const expertEndpoint = '/api/translate/expert';
  const selectedEndpoint = activeTab === 'basic' ? basicEndpoint : activeTab === 'advanced' ? advancedEndpoint : expertEndpoint;

  const promptExamples = {
  nodejs: `const fetch = require('node-fetch');
  async function promptAI(prompt, apiKey) {
      const response = await fetch('/api/prompt', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
          },
          body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
          throw new Error('Prompt failed: ' + await response.text());
      }

      return await response.json();
  }

  // Example usage
  const apiKey = 'your-api-key';
  promptAI('Write a poem about the ocean', apiKey)
      .then(result => console.log(result))
      .catch(err => console.error(err));`,

  python: `import requests

  def prompt_ai(prompt, api_key):
  url = "/api/prompt"
  headers = {
    "Content-Type": "application/json",
    "x-api-key": api_key
  }
  data = { "prompt": prompt }

  response = requests.post(url, headers=headers, json=data)
  if response.status_code != 200:
    raise Exception("Prompt failed: " + response.text)
  return response.json()

  # Example usage
  api_key = "your-api-key"
  result = prompt_ai("Write a poem about the ocean", api_key)
  print(result)`,

  csharp: `using System;
  using System.Net.Http;
  using System.Text;
  using System.Threading.Tasks;

  class Program {
      static async Task Main() {
          var client = new HttpClient();
          var request = new HttpRequestMessage(HttpMethod.Post, "/api/prompt");
          request.Headers.Add("x-api-key", "your-api-key");

          var json = "{ \\"prompt\\": \\"Write a poem about the ocean\\" }";
          request.Content = new StringContent(json, Encoding.UTF8, "application/json");

          var response = await client.SendAsync(request);
          var result = await response.Content.ReadAsStringAsync();
          Console.WriteLine(result);
      }
  }`,

  javascript: `fetch('/api/prompt', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your-api-key'
      },
      body: JSON.stringify({
          prompt: 'Write a poem about the ocean'
      })
  })
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.error(err));`,

  curl: `curl -X POST \\
  /api/prompt \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -d '{
  "prompt": "Write a poem about the ocean"
  }'`,

  postman: `POST /api/prompt
  Content-Type: application/json
  x-api-key: your-api-key

  {
  "prompt": "Write a poem about the ocean"
  }`
  };

  const baseCode = `async function translate(text, baseLanguage, targetLanguage, apiKey) {
  const response = await fetch('${selectedEndpoint}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({ text, baseLanguage, targetLanguage })
  });

  if (!response.ok) {
    throw new Error('Translation failed: ' + (await response.text()));
  }

  return await response.json();
  }`;

  const nodeJsCode = `const fetch = require('node-fetch');

  ${baseCode}

  // Example usage
  const apiKey = 'your-api-key';
  translate('Hello world', 'en', 'fr', apiKey)
  .then(result => console.log(result))
  .catch(error => console.error(error));`;

  const pythonCode = `import requests
  import json

  def translate(text, base_language, target_language, api_key):
    url = "${selectedEndpoint}"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }
    payload = {
        "text": text,
        "baseLanguage": base_language,
        "targetLanguage": target_language
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"Translation failed: {response.text}")

    return response.json()

  # Example usage
  api_key = "your-api-key"
  result = translate("Hello world", "en", "fr", api_key)
  print(result)`;

  const curlCode = `curl -X POST \\
  ${selectedEndpoint} \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: your-api-key' \\
  -d '{
    "text": "Hello world",
    "baseLanguage": "en",
    "targetLanguage": "fr"
  }'`;

  const csharpCode = `using System;
  using System.Net.Http;
  using System.Text;
  using System.Threading.Tasks;

  class Program {
  static async Task Main() {
    var client = new HttpClient();
    var request = new HttpRequestMessage(HttpMethod.Post, "${selectedEndpoint}");
    request.Headers.Add("x-api-key", "your-api-key");

    var json = "{ \"text\": \"Hello world\", \"baseLanguage\": \"en\", \"targetLanguage\": \"fr\" }";
    request.Content = new StringContent(json, Encoding.UTF8, "application/json");

    var response = await client.SendAsync(request);
    var responseBody = await response.Content.ReadAsStringAsync();
    Console.WriteLine(responseBody);
  }
  }`;

  const javascriptCode = `fetch('${selectedEndpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    text: 'Hello world',
    baseLanguage: 'en',
    targetLanguage: 'fr'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;

  const postmanCode = `POST ${selectedEndpoint}
Content-Type: application/json
x-api-key: your-api-key

{
  "text": "Hello world",
  "baseLanguage": "en",
  "targetLanguage": "fr"
}`;

const codeExamples = activeTab === 'prompt' ? promptExamples : {
  nodejs: nodeJsCode,
  python: pythonCode,
  curl: curlCode,
  csharp: csharpCode,
  javascript: javascriptCode,
  postman: postmanCode
};


  return (
    <div className="space-y-6 mt-[50px] md:mt-[10px]">
      <h1 className="text-3xl font-bold">API Reference</h1>
      
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          <TabsTrigger value="prompt">Prompt AI</TabsTrigger>
          <TabsTrigger value="basic">Basic Translation</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Translation</TabsTrigger>
          <TabsTrigger value="expert">Expert Translation</TabsTrigger>
        </TabsList>

        <TabsContent value="prompt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prompt AI API</CardTitle>
              <CardDescription>
                Powered by Azure OpenAI GPT-4o — ideal for generating intelligent, structured responses from custom prompts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Endpoint</h3>
                  <p className="text-sm font-mono bg-muted p-2 rounded-none">/api/prompt</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <p className="text-sm mb-2">
                    API key must be provided in the <code className="bg-muted px-1 rounded-sm">x-api-key</code> header.
                    Client must have access to <strong>Prompt AI</strong> tier.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Request Body</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-none whitespace-pre-wrap">
                    {`{ "prompt": "Generate a detailed response based on this input..." }`}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Response</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-none whitespace-pre-wrap">
                    {`{ "reply": "Generated response", "tokens": 65, "inputTokens": 25, "outputTokens": 40, "cost": 0.000325 }`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Token & Cost Calculation</CardTitle>
                <CardDescription>How Prompt AI pricing works</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Input tokens: $0.0011 per 1K tokens</li>
                  <li>Output tokens: $0.0044 per 1K tokens</li>
                  <li>Total cost = input + output cost</li>
                  <li>Backed by GPT-4o or GPT-4o-mini via Azure</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
                <CardDescription>Where Prompt AI shines</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Content generation and summaries</li>
                  <li>Structured knowledge retrieval</li>
                  <li>Complex instruction handling</li>
                  <li>Natural-sounding expert responses</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Translation API</CardTitle>
              <CardDescription>
                Powered by Azure Translator AI - ideal for simple text translation needs with support for over 100 languages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Endpoint</h3>
                  <p className="text-sm font-mono bg-muted p-2 rounded-none">{basicEndpoint}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <p className="text-sm mb-2">
                    API key must be provided in the <code className="bg-muted px-1 rounded-sm">x-api-key</code> header.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Request Body</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-none">
                    {`{   "text": "Text to translate",   "baseLanguage": "en",   "targetLanguage": "fr" }`}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Response</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-none">
                    {`{   "translatedText": "Translated text",   "tokens": 12,   "cost": 0.012 }`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Character Usage</CardTitle>
                <CardDescription>
                  How character-based pricing works for Azure Translate AI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Charged per character in the input text</li>
                  <li>Pricing: $10 per 1 million characters (~$0.00001 per character)</li>
                  <li>Includes spaces, punctuation, and markup characters</li>
                  <li>No minimum character requirement</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  What's included in the Azure-powered basic tier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Backed by Microsoft Azure Translator</li>
                  <li>Supports over 100 languages</li>
                  <li>Real-time translation</li>
                  <li>Suitable for general, simple, and user-facing content</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Translation API</CardTitle>
              <CardDescription> Powered by Azure OpenAI GPT-4o-mini — delivers prompt-based translations with structural
                accuracy and better context for professional use. </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Endpoint</h3>
                  <p className="text-sm font-mono bg-muted p-2 rounded-none">{advancedEndpoint}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <p className="text-sm mb-2">
                    API key must be provided in the <code className="bg-muted px-1 rounded-sm">x-api-key</code> header. Client
                    must have access to the <strong>Advanced Translation</strong> tier.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Prompt Logic</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-none whitespace-pre-wrap">

                    {`You are a professional translation engine. Translate the following content from {baseLanguage} to {targetLanguage}.
Instructions:
- Preserve all HTML structure and tags exactly as they appear.
- Do not explain, comment, or modify the structure or formatting.
- Do not include Markdown, code blocks, or language annotations.
- Return only the pure translated text with identical structure.
- Content to translate: {text}`}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Response</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-none">
                    {`{ "translatedText": "Translated text", "tokens": 128, "cost": 0.018 }`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
                <CardDescription> Token and cost calculation for GPT-powered translation. </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Model: gpt-4o-mini (can be upgraded to gpt-4o)</li>
                  <li>1 token ≈ 3.5 characters</li>
                  <li>Input: $0.0011 per 1K tokens</li>
                  <li>Output: $0.0044 per 1K tokens</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  What makes Advanced tier suitable for professionals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Prompt-based accurate translation</li>
                  <li>Preserves HTML structure</li>
                  <li>Handles domain-specific terminology</li>
                  <li>Suitable for business websites and content</li>
                </ul>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
        <TabsContent value="expert" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expert Translation API</CardTitle>
              <CardDescription> Premium translation powered by GPT-4o or GPT-4o-mini with deep fluency, cultural nuance, and
                native-like precision. </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Endpoint</h3>
                  <p className="text-sm font-mono bg-muted p-2 rounded-none">{expertEndpoint}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <p className="text-sm mb-2">
                    API key must be provided in the <code className="bg-muted px-1 rounded-sm">x-api-key</code> header. Access
                    is restricted to <strong>Expert Translation</strong> tier.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Prompt Logic</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-none whitespace-pre-wrap">
                    {`You are a highly experienced native-speaking professional translator. Translate the following content from '{baseLanguage}' to '{targetLanguage}' with perfect fluency, clarity,and cultural appropriateness.
Instructions:
- Ensure the translation reads as if originally written by a native {targetLanguage} speaker.
- Improve fluency and word choice; avoid literal or awkward translations.
- Adapt idioms, expressions, and tone to match cultural norms.
- Use precise, expert-level vocabulary and grammar — suitable for UI labels, section titles, websites, and
digital interfaces.
- If the content includes HTML, preserve the structure and all tags exactly as provided.
- Do not include explanations, markdown syntax, comments, or formatting hints.
- Return only the translated content — nothing else.
- Content to translate: {text}`}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Response</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-none">
                    {`{ "translatedText": "Translated text", "tokens": 152, "cost": 0.024 }`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
                <CardDescription> Token and cost breakdown for expert translations. </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Model: gpt-4o or gpt-4o-mini</li>
                  <li>1 token ≈ 3 characters</li>
                  <li>Input: $0.0011 per 1K tokens</li>
                  <li>Output: $0.0044 per 1K tokens</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  Why Expert tier is ideal for high-stakes content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Native-level fluency and tone</li>
                  <li>Cultural and idiomatic accuracy</li>
                  <li>Flawless structure and grammar</li>
                  <li>Perfect for legal, UI, medical, and professional content</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
          <CardDescription>
            How to use the {activeTab} translation API in different languages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="nodejs">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="nodejs">Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="csharp">C#</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="postman">Postman</TabsTrigger>
            </TabsList>
            {Object.entries(codeExamples).map(([label, code]) => (
              <TabsContent key={label} value={label} className="mt-4">
                <div className="relative rounded-md overflow-hidden border text-sm">
                  <div className="bg-zinc-900 text-zinc-300 font-mono text-xs px-4 py-2 border-b border-zinc-800">
                    {label.toUpperCase()}
                  </div>
                  <pre className="bg-black text-white p-4 overflow-x-auto">
                    <code className="whitespace-pre-wrap">{code}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-[0px] right-2 h-[33px]"
                    onClick={() => copyCodeToClipboard(code)}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Note: Replace 'your-api-key' with the API key generated for your client.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}