import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography,
  Divider, 
  Box,
  Chip
} from '@mui/material';
import { 
  Fingerprint as FingerprintIcon,
  Badge as BadgeIcon,
  Face as FaceIcon,
  ContactlessOutlined as ContactlessIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AccessLogProps {
  logs: any[];
}

export default function AccessLogList({ logs }: AccessLogProps) {
  if (!logs || logs.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay registros de acceso recientes
        </Typography>
      </Box>
    );
  }
  
  const getAccessIcon = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return <FingerprintIcon />;
      case 'face':
        return <FaceIcon />;
      case 'badge':
        return <BadgeIcon />;
      case 'nfc':
        return <ContactlessIcon />;
      default:
        return <BadgeIcon />;
    }
  };
  
  return (
    <List sx={{ width: '100%', p: 0 }}>
      {logs.map((log, index) => (
        <React.Fragment key={log.id}>
          <ListItem alignItems="flex-start">
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: log.verified ? 'success.main' : 'warning.main' }}>
                {getAccessIcon(log.access_type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">
                    {log.users?.name || 'Usuario desconocido'}
                  </Typography>
                  <Chip 
                    label={log.verified ? "Acceso" : "Rechazado"} 
                    size="small"
                    color={log.verified ? "success" : "error"}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              }
              secondary={
                <>
                  <Typography variant="body2" component="span" color="text.primary">
                    {log.users?.email || log.users?.phone || 'Sin datos'}
                  </Typography>
                  <Typography variant="caption" component="div" color="text.secondary">
                    {formatDistanceToNow(new Date(log.created_at), { 
                      addSuffix: true,
                      locale: es
                    })}
                  </Typography>
                </>
              }
            />
          </ListItem>
          {index < logs.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
}