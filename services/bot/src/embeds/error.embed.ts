import { APIEmbed } from 'discord.js';
import { COLORS } from '../config/constants';

/**
 * Build error embed with custom message
 */
export function buildErrorEmbed(message: string, details?: string): APIEmbed {
  const embed: APIEmbed = {
    color: COLORS.error,
    title: 'Error',
    description: message,
    footer: {
      text: 'NosMarket',
    },
    timestamp: new Date().toISOString(),
  };

  if (details) {
    embed.fields = [
      {
        name: 'Details',
        value: details,
        inline: false,
      },
    ];
  }

  return embed;
}

/**
 * Build success embed with custom message
 */
export function buildSuccessEmbed(message: string, details?: string): APIEmbed {
  const embed: APIEmbed = {
    color: COLORS.success,
    title: 'Success',
    description: message,
    footer: {
      text: 'NosMarket',
    },
    timestamp: new Date().toISOString(),
  };

  if (details) {
    embed.fields = [
      {
        name: 'Details',
        value: details,
        inline: false,
      },
    ];
  }

  return embed;
}

/**
 * Build info embed with custom message
 */
export function buildInfoEmbed(message: string, details?: string): APIEmbed {
  const embed: APIEmbed = {
    color: COLORS.info,
    title: 'Info',
    description: message,
    footer: {
      text: 'NosMarket',
    },
    timestamp: new Date().toISOString(),
  };

  if (details) {
    embed.fields = [
      {
        name: 'Details',
        value: details,
        inline: false,
      },
    ];
  }

  return embed;
}

/**
 * Build warning embed with custom message
 */
export function buildWarningEmbed(message: string, details?: string): APIEmbed {
  const embed: APIEmbed = {
    color: COLORS.warning,
    title: 'Warning',
    description: message,
    footer: {
      text: 'NosMarket',
    },
    timestamp: new Date().toISOString(),
  };

  if (details) {
    embed.fields = [
      {
        name: 'Details',
        value: details,
        inline: false,
      },
    ];
  }

  return embed;
}

/**
 * Build permission denied embed
 */
export function buildPermissionDeniedEmbed(requiresRole?: string): APIEmbed {
  return {
    color: COLORS.error,
    title: 'Permission Denied',
    description: requiresRole
      ? `This action requires the ${requiresRole} role.`
      : 'You do not have permission to perform this action.',
    footer: {
      text: 'NosMarket',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build not found embed
 */
export function buildNotFoundEmbed(resourceType: string, identifier?: string): APIEmbed {
  return {
    color: COLORS.error,
    title: 'Not Found',
    description: `${resourceType}${identifier ? ` \`${identifier}\` ` : ' '}was not found.`,
    footer: {
      text: 'NosMarket',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build rate limit embed
 */
export function buildRateLimitEmbed(retryAfterSeconds?: number): APIEmbed {
  return {
    color: COLORS.warning,
    title: 'Rate Limited',
    description: retryAfterSeconds
      ? `Please wait ${retryAfterSeconds} seconds before trying again.`
      : 'You are being rate limited. Please wait before trying again.',
    footer: {
      text: 'NosMarket',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build generic error response embed for API errors
 */
export function buildApiErrorEmbed(statusCode: number, message?: string): APIEmbed {
  const errorMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };

  return {
    color: COLORS.error,
    title: `Error ${statusCode}`,
    description: message || errorMessages[statusCode] || 'An unexpected error occurred.',
    footer: {
      text: 'NosMarket',
    },
    timestamp: new Date().toISOString(),
  };
}
