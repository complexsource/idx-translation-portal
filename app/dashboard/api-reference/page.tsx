"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ApiReferencePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  
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
  
  const baseCode = `async function translate(text, baseLanguage, targetLanguage, apiKey) {
  const response = await fetch('${activeTab === 'basic' ? basicEndpoint : activeTab === 'advanced' ? advancedEndpoint : expertEndpoint}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      text,
      baseLanguage,
      targetLanguage
    })
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
    url = "${activeTab === 'basic' ? basicEndpoint : activeTab === 'advanced' ? advancedEndpoint : expertEndpoint}"
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
  ${activeTab === 'basic' ? basicEndpoint : activeTab === 'advanced' ? advancedEndpoint : expertEndpoint} \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: your-api-key' \\
  -d '{
    "text": "Hello world",
    "baseLanguage": "en",
    "targetLanguage": "fr"
  }'`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">API Reference</h1>
      
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Translation</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Translation</TabsTrigger>
          <TabsTrigger value="expert">Expert Translation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Translation API</CardTitle>
              <CardDescription>
                Standard translation capabilities suitable for simple texts and general purpose translation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Endpoint</h3>
                  <p className="text-sm font-mono bg-muted p-2 rounded-md">{basicEndpoint}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <p className="text-sm mb-2">
                    API key must be provided in the <code className="bg-muted px-1 rounded-sm">x-api-key</code> header.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Request Body</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-md">
                    {`{
  "text": "Text to translate",
  "baseLanguage": "en",
  "targetLanguage": "fr"
}`}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Response</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-md">
                    {`{
  "translatedText": "Translated text",
  "tokens": 12,
  "cost": 0.012
}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
                <CardDescription>
                  How tokens are calculated for this translation tier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Approximately 1 token per 4 characters</li>
                  <li>Cost: $0.001 per token</li>
                  <li>Suitable for simple, short texts</li>
                  <li>Support for most common languages</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  What's included in the basic translation tier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Standard translation quality</li>
                  <li>Basic context understanding</li>
                  <li>Common language pairs</li>
                  <li>Suitable for casual content</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Translation API</CardTitle>
              <CardDescription>
                Enhanced translation with better context handling, suitable for professional content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Endpoint</h3>
                  <p className="text-sm font-mono bg-muted p-2 rounded-md">{advancedEndpoint}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <p className="text-sm mb-2">
                    API key must be provided in the <code className="bg-muted px-1 rounded-sm">x-api-key</code> header.
                    Client must have access to the Advanced tier or higher.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Request Body</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-md">
                    {`{
  "text": "Text to translate",
  "baseLanguage": "en",
  "targetLanguage": "fr"
}`}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Response</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-md">
                    {`{
  "translatedText": "Translated text",
  "tokens": 12,
  "cost": 0.018
}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
                <CardDescription>
                  How tokens are calculated for this translation tier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Approximately 1 token per 3.5 characters</li>
                  <li>Cost: $0.0015 per token</li>
                  <li>Enhanced processing for better results</li>
                  <li>Support for a wider range of languages</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  What's included in the advanced translation tier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Advanced translation quality</li>
                  <li>Improved context understanding</li>
                  <li>Support for domain-specific terminology</li>
                  <li>Suitable for business and professional content</li>
                  <li>Better handling of idioms and expressions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="expert" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expert Translation API</CardTitle>
              <CardDescription>
                Premium translation with the highest quality and customization options.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Endpoint</h3>
                  <p className="text-sm font-mono bg-muted p-2 rounded-md">{expertEndpoint}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Authentication</h3>
                  <p className="text-sm mb-2">
                    API key must be provided in the <code className="bg-muted px-1 rounded-sm">x-api-key</code> header.
                    Client must have access to the Expert tier.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Request Body</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-md">
                    {`{
  "text": "Text to translate",
  "baseLanguage": "en",
  "targetLanguage": "fr"
}`}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Response</h3>
                  <div className="text-sm font-mono bg-muted p-2 rounded-md">
                    {`{
  "translatedText": "Translated text",
  "tokens": 12,
  "cost": 0.024
}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
                <CardDescription>
                  How tokens are calculated for this translation tier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Approximately 1 token per 3 characters</li>
                  <li>Cost: $0.002 per token</li>
                  <li>Deepest processing for premium results</li>
                  <li>Support for all available languages</li>
                  <li>Specialized domain terminology support</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>
                  What's included in the expert translation tier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Highest translation quality</li>
                  <li>Deep context and semantic understanding</li>
                  <li>Support for specialized terminology</li>
                  <li>Preservation of tone and style</li>
                  <li>Suitable for legal, medical, and technical content</li>
                  <li>Culturally appropriate adaptations</li>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="nodejs">Node.js</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            <TabsContent value="nodejs" className="mt-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                  <code>{nodeJsCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyCodeToClipboard(nodeJsCode)}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="python" className="mt-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                  <code>{pythonCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyCodeToClipboard(pythonCode)}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="curl" className="mt-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                  <code>{curlCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyCodeToClipboard(curlCode)}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
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