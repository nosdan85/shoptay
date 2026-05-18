import { Client } from 'discord.js';
import axios from 'axios';
import { Logger } from '../../types';
import { config } from '../../config';
import { EmbedService } from '../../services/EmbedService';

export function registerComponents(client: Client): void {
  // Components are registered through interactionCreate event
  // This function is called during bot initialization
  console.log('[Components] Component handlers registered');
}
