import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Refresh, Check } from '@mui/icons-material';
import { green } from '@mui/material/colors';

interface RefreshWebSocketButtonProps {
  onRefresh: () => void;
  isConnected: boolean;
}

export default function RefreshWebSocketButton({ onRefresh, isConnected }: RefreshWebSocketButtonProps) {
  return (
    <Tooltip title={isConnected ? "Conexión activa" : "Reconectar"}>
      <IconButton 
        size="small" 
        onClick={onRefresh}
        sx={{ 
          bgcolor: isConnected ? 'rgba(0,200,0,0.1)' : 'transparent',
          '&:hover': {
            bgcolor: isConnected ? 'rgba(0,200,0,0.2)' : 'rgba(0,0,0,0.08)'
          }
        }}
      >
        {isConnected ? 
          <Check fontSize="small" sx={{ color: green[500] }} /> : 
          <Refresh fontSize="small" />
        }
      </IconButton>
    </Tooltip>
  );
}