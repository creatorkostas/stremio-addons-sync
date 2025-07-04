"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Loader2 } from "lucide-react"
import { json } from "stream/consumers"

const STREMIO_API_BASE = "https://api.strem.io/api/"

export default function Page() {
  const [authKey, setAuthKey] = useState("")
  const [addons, setAddons] = useState<any[]>([])
  const [fileName, setFileName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/json") {
      setMessage({ type: "error", text: "Please upload a valid JSON file" })
      return
    }

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const jsonData = (JSON.parse(e.target?.result as string))["addons"]["addons"]
        setAddons(jsonData)
        console.log(jsonData)
        setMessage({
          type: "success",
          text: `JSON file loaded successfully (${Array.isArray(jsonData) ? jsonData.length : "unknown"} items)`,
        })
      } catch (error) {
        setMessage({ type: "error", text: "Invalid JSON file format" })
        setAddons([])
      }
    }

    reader.readAsText(file)
  }

  const syncUserAddons = async () => {
    if (!authKey) {
      setMessage({ type: "error", text: "No auth key provided" })
      return
    }

    if (!addons.length) {
      setMessage({ type: "error", text: "No addons data loaded. Please upload a JSON file first." })
      return
    }

    setIsLoading(true)
    setMessage(null)

    console.log("Syncing addons...")

    const url = `${STREMIO_API_BASE}addonCollectionSet`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "AddonCollectionSet",
          authKey: authKey,
          addons: addons,
        }),
      })

      const data = await response.json()

      if (!("result" in data) || data.result == null) {
        console.error("Sync failed: ", data)
        setMessage({ type: "error", text: "Sync failed with unknown error" })
        return
      }

      if (!data.result.success) {
        setMessage({ type: "error", text: `Failed to sync addons: ${data.result.error}` })
      } else {
        console.log("Sync complete: ", data)
        setMessage({ type: "success", text: "Sync complete!" })
      }
    } catch (error) {
      console.error("Error fetching user addons", error)
      setMessage({ type: "error", text: `Error syncing addons: ${error}` })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Stremio Addon Sync</CardTitle>
            <CardDescription>Upload your addon configuration JSON file and sync it with Stremio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auth Key Input */}
            <div className="space-y-2">
              <Label htmlFor="authKey">Stremio Auth Key</Label>
              <Input
                id="authKey"
                
                placeholder="Enter your Stremio auth key"
                value={authKey}
                onChange={(e) => setAuthKey(e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="jsonFile">Addon Configuration (JSON)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="jsonFile"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 h-auto"
                />
                {fileName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {fileName}
                  </div>
                )}
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <Alert className={message.type === "error" ? "border-destructive" : "border-green-500"}>
                <AlertDescription className={message.type === "error" ? "text-destructive" : "text-green-600"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Sync Button */}
            <Button onClick={syncUserAddons} disabled={isLoading || !authKey || !addons.length} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                "Sync Addons"
              )}
            </Button>

            {/* Instructions */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Instructions:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Enter your Stremio authentication key</li>
                <li>Upload a JSON file containing your addon configuration</li>
                <li>Click "Sync Addons" to synchronize with Stremio</li>
              </ol>
	      <p>
		<strong>How to get the Stremio AuthKey?</strong>
	      </p>
	      <ol className="list-decimal list-inside space-y-1">
		<li>Login to https://web.stremio.com using your Stremio credentials in your browser. </li>
		<li>Open the developer console and paste the follow code snippet: <code>JSON.parse(localStorage.getItem("profile")).auth.key</code> </li>
		<li>Take the output value and paste it into the form above.</li>
	      </ol>
              <p className="mt-4">
                <strong>Note:</strong> The JSON file should contain an array of addon objects that match Stremio's addon
                format.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
