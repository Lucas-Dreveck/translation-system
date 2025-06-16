import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Loader2, Languages, Copy, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Add a LANGUAGES constant
const LANGUAGES = {
  'en': 'Inglês',
  'pt': 'Português',
  'es': 'Espanhol',
  'fr': 'Francês',
  'de': 'Alemão',
  'it': 'Italiano',
  'ja': 'Japonês',
  'ko': 'Coreano',
  'zh': 'Chinês',
  'ru': 'Russo',
  'ar': 'Árabe',
};

function App() {
  const [text, setText] = useState('')
  const [selectedPair, setSelectedPair] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [languagePairs, setLanguagePairs] = useState([])
  const [translationMethod, setTranslationMethod] = useState(null)
  const [loadingLanguages, setLoadingLanguages] = useState(true)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translations, setTranslations] = useState([])

  // Carregar idiomas e método de tradução na inicialização
  useEffect(() => {
    loadLanguageData()
  }, [])

  const loadLanguageData = async () => {
    try {
      setLoadingLanguages(true)
      
      // Carregar pares de idiomas
      const pairsResponse = await fetch(`${API_BASE_URL}/translations/language-pairs`)
      if (pairsResponse.ok) {
        const pairsData = await pairsResponse.json()
        setLanguagePairs(pairsData.languagePairs || [])
      }
      
      // Carregar método de tradução
      const methodResponse = await fetch(`${API_BASE_URL}/translations/method`)
      if (methodResponse.ok) {
        const methodData = await methodResponse.json()
        setTranslationMethod(methodData)
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados de idiomas:', error)
      // Fallback para lista estática em caso de erro
      setLanguagePairs([
        { source: 'en', target: 'pt', label: 'Inglês → Português' },
        { source: 'pt', target: 'en', label: 'Português → Inglês' },
        { source: 'en', target: 'es', label: 'Inglês → Espanhol' },
        { source: 'es', target: 'en', label: 'Espanhol → Inglês' }
      ])
    } finally {
      setLoadingLanguages(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTranslate = async () => {
    if (!text.trim() || !selectedPair) {
      setError('Por favor, insira um texto e selecione um par de idiomas')
      return
    }

    setIsTranslating(true)
    setError('')

    try {
      const pair = languagePairs.find(p => `${p.source}-${p.target}` === selectedPair)
      
      const response = await fetch(`${API_BASE_URL}/translations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          sourceLanguage: pair.source,
          targetLanguage: pair.target
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar tradução')
      }

      const data = await response.json()
      
      // Adicionar nova tradução à lista
      const newTranslation = {
        requestId: data.requestId,
        originalText: text.trim(),
        sourceLanguage: pair.source,
        targetLanguage: pair.target,
        status: data.status,
        createdAt: data.createdAt,
        translatedText: null
      }

      setTranslations(prev => [newTranslation, ...prev])
      setText('')
      
      // Começar a verificar o status
      pollTranslationStatus(data.requestId)

    } catch (err) {
      setError(err.message)
    } finally {
      setIsTranslating(false)
    }
  }

  const pollTranslationStatus = async (requestId) => {
    const maxAttempts = 30 // 30 tentativas = 1.5 minutos
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/translations/${requestId}`)
        
        if (response.ok) {
          const data = await response.json()
          
          setTranslations(prev => 
            prev.map(t => 
              t.requestId === requestId 
                ? { ...t, ...data }
                : t
            )
          )

          // Se ainda está processando e não excedeu tentativas, continuar
          if ((data.status === 'queued' || data.status === 'processing') && attempts < maxAttempts) {
            attempts++
            setTimeout(poll, 3000) // Verificar a cada 3 segundos
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err)
      }
    }

    poll()
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Languages className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Sistema de Tradução</h1>
          </div>
          <p className="text-lg text-gray-600">
            Tecnologias Emergentes - ADS 5º Período
          </p>
        </div>

        {/* Translation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nova Tradução
              {translationMethod && (
                <Badge variant={translationMethod.method === 'gemini' ? 'default' : 'secondary'}>
                  {translationMethod.method === 'gemini' ? '🤖 IA Gemini' : '📖 Mock'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Digite o texto que deseja traduzir e selecione o par de idiomas
              {translationMethod && (
                <span className="block mt-1 text-xs">
                  {translationMethod.description} • {translationMethod.capabilities.languagePairs} pares disponíveis
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Texto para traduzir:</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite o texto que deseja traduzir..."
                className="min-h-[100px]"
                maxLength={5000}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {text.length}/5000 caracteres
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Par de idiomas:
                {loadingLanguages && (
                  <span className="ml-2 text-xs text-gray-500">
                    <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                    Carregando...
                  </span>
                )}
              </label>
              <Select value={selectedPair} onValueChange={setSelectedPair} disabled={loadingLanguages}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLanguages ? "Carregando idiomas..." : "Selecione o par de idiomas"} />
                </SelectTrigger>
                <SelectContent>
                  {languagePairs.map((pair) => (
                    <SelectItem key={`${pair.source}-${pair.target}`} value={`${pair.source}-${pair.target}`}>
                      {pair.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleTranslate} 
                disabled={isTranslating || !text.trim() || !selectedPair || loadingLanguages}
                className="flex-1"
              >
                {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando tradução...
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  Traduzir
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadLanguageData}
              disabled={loadingLanguages}
              className="px-3"
              title="Recarregar idiomas"
            >
              <RefreshCw className={`h-4 w-4 ${loadingLanguages ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          </CardContent>
        </Card>

        {/* Translations List */}
        {translations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Traduções</CardTitle>
              <CardDescription>
                Acompanhe o status das suas traduções em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {translations.map((translation) => (
                  <div key={translation.requestId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(translation.status)}
                        <Badge className={getStatusColor(translation.status)}>
                          {translation.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {LANGUAGES[translation.sourceLanguage]} → {LANGUAGES[translation.targetLanguage]}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(translation.createdAt)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Texto Original:
                        </label>
                        <div className="p-3 bg-gray-50 rounded border text-sm">
                          {translation.originalText}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tradução:
                        </label>
                        <div className="p-3 bg-gray-50 rounded border text-sm min-h-[60px] flex items-center">
                          {translation.status === 'completed' ? (
                            <div className="flex items-center justify-between w-full">
                              <span>{translation.translatedText}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(translation.translatedText)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : translation.status === 'failed' ? (
                            <span className="text-red-600">
                              Erro: {translation.errorMessage || 'Falha na tradução'}
                            </span>
                          ) : translation.status === 'processing' ? (
                            <span className="text-blue-600 flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Traduzindo...
                            </span>
                          ) : (
                            <span className="text-yellow-600">Aguardando na fila...</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400">
                      ID: {translation.requestId}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4 text-sm text-gray-500">
          <p>Sistema desenvolvido com Express.js, MongoDB, Redis e React</p>
          <p>Comunicação assíncrona via filas de mensagens</p>
        </div>
      </div>
    </div>
  )
}

export default App

