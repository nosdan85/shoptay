import { Injectable, BadRequestException, PipeTransform } from '@nestjs/common';
import { DomHandler } from 'domhandler';
import { DomUtils } from 'htmlparser2';

export interface SanitizationOptions {
  stripHtml?: boolean;
  maxLength?: number;
  trim?: boolean;
  lowercase?: boolean;
}

export const DEFAULT_SANITIZATION_OPTIONS: SanitizationOptions = {
  stripHtml: true,
  maxLength: 1000,
  trim: true,
  lowercase: false,
};

@Injectable()
export class SanitizeService {
  private readonly htmlTagPattern = /<[^>]*>/g;
  private readonly scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  private readonly stylePattern = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
  private readonly eventHandlerPattern = /\bon\w+\s*=/gi;
  private readonly javascriptPattern = /javascript:/gi;
  private readonly iframePattern = /<iframe[^>]*>/gi;
  private readonly objectPattern = /<object[^>]*>/gi;
  private readonly embedPattern = /<embed[^>]*>/gi;
  private readonly formPattern = /<form[^>]*>/gi;

  sanitize(value: unknown, options: SanitizationOptions = DEFAULT_SANITIZATION_OPTIONS): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value, options);
    }

    if (typeof value === 'object') {
      return this.sanitizeObject(value, options);
    }

    return value;
  }

  sanitizeString(value: string, options: SanitizationOptions = DEFAULT_SANITIZATION_OPTIONS): string {
    if (!value) return value;

    let result = value;

    // Remove script tags and content
    result = result.replace(this.scriptPattern, '');

    // Remove style tags and content
    result = result.replace(this.stylePattern, '');

    // Remove iframes
    result = result.replace(this.iframePattern, '');

    // Remove objects
    result = result.replace(this.objectPattern, '');
    result = result.replace(this.embedPattern, '');

    // Remove form tags
    result = result.replace(this.formPattern, '');

    // Remove event handlers (onclick, onerror, etc.)
    result = result.replace(this.eventHandlerPattern, '');

    // Remove javascript: URLs
    result = result.replace(this.javascriptPattern, '');

    if (options.stripHtml !== false) {
      // Remove remaining HTML tags
      result = result.replace(this.htmlTagPattern, '');
    }

    // Trim whitespace
    if (options.trim !== false) {
      result = result.trim();
    }

    // Lowercase if requested
    if (options.lowercase) {
      result = result.toLowerCase();
    }

    // Enforce max length
    if (options.maxLength && result.length > options.maxLength) {
      result = result.substring(0, options.maxLength);
    }

    return result;
  }

  sanitizeObject(obj: any, options: SanitizationOptions = DEFAULT_SANITIZATION_OPTIONS): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item, options));
    }

    const result: any = {};
    for (const key of Object.keys(obj)) {
      // Skip internal/private fields
      if (key.startsWith('_') || key.startsWith('$')) {
        continue;
      }

      result[key] = this.sanitize(obj[key], options);
    }

    return result;
  }

  sanitizeEmail(email: string): string {
    if (!email) return email;

    // Basic email validation and sanitization
    const sanitized = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(sanitized)) {
      throw new BadRequestException('Invalid email format');
    }

    // Remove dangerous characters
    return sanitized.replace(/[<>'"]/g, '');
  }

  sanitizeUsername(username: string): string {
    if (!username) return username;

    // Remove special characters except common ones
    return username
      .trim()
      .replace(/[^\w\s-_.]/g, '')
      .substring(0, 100);
  }

  sanitizeDiscordId(id: string): string {
    if (!id) return id;

    // Discord IDs are numeric strings
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('Invalid Discord ID format');
    }

    return id;
  }

  sanitizeUrl(url: string): string {
    if (!url) return url;

    // Remove javascript: and data: URLs
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:')) {
      return '';
    }

    // Only allow http, https, and relative URLs
    if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://') && !lowerUrl.startsWith('/')) {
      return '';
    }

    return url.trim().substring(0, 2048);
  }
}

@Injectable()
export class SanitizePipe implements PipeTransform {
  constructor(
    private readonly options: SanitizationOptions = DEFAULT_SANITIZATION_OPTIONS,
  ) {}

  transform(value: any): any {
    return new SanitizeService().sanitize(value, this.options);
  }
}

// Field-specific sanitization presets
export const SANITIZATION_PRESETS = {
  name: {
    stripHtml: true,
    maxLength: 100,
    trim: true,
    lowercase: false,
  },
  description: {
    stripHtml: true,
    maxLength: 5000,
    trim: true,
    lowercase: false,
  },
  email: {
    stripHtml: true,
    maxLength: 255,
    trim: true,
    lowercase: true,
  },
  username: {
    stripHtml: true,
    maxLength: 100,
    trim: true,
    lowercase: false,
  },
  discordId: {
    stripHtml: true,
    maxLength: 20,
    trim: true,
    lowercase: false,
  },
  productName: {
    stripHtml: true,
    maxLength: 200,
    trim: true,
    lowercase: false,
  },
  productDescription: {
    stripHtml: true,
    maxLength: 2000,
    trim: true,
    lowercase: false,
  },
  couponCode: {
    stripHtml: true,
    maxLength: 50,
    trim: true,
    lowercase: true,
  },
  orderId: {
    stripHtml: true,
    maxLength: 50,
    trim: true,
    lowercase: false,
  },
  url: {
    stripHtml: true,
    maxLength: 2048,
    trim: true,
    lowercase: true,
  },
};
