import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, ExternalLink, MapPin } from "lucide-react"
import type { ContactInfo } from "@/types/creatorTypes"

interface ContactInfoPanelProps {
  contactInfo: ContactInfo
}

export function ContactInfoPanel({ contactInfo }: ContactInfoPanelProps) {
  const hasAnyContact = contactInfo.business_email || 
                       contactInfo.business_phone || 
                       contactInfo.external_url || 
                       contactInfo.location

  if (!hasAnyContact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            No contact information available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contactInfo.business_email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`mailto:${contactInfo.business_email}`}
              className="text-sm text-blue-600 hover:underline truncate"
            >
              {contactInfo.business_email}
            </a>
          </div>
        )}
        
        {contactInfo.business_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`tel:${contactInfo.business_phone}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {contactInfo.business_phone}
            </a>
          </div>
        )}
        
        {contactInfo.external_url && (
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <a 
              href={contactInfo.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline truncate"
            >
              {contactInfo.external_url.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        
        {contactInfo.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {contactInfo.location}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}