import { config } from '../config/env';
import { sleep } from '../lib/async';
import { logger } from '../lib/logger';

export interface Email {
  to: string;
  subject: string;
  body: string;
}

export interface Mailer {
  send(email: Email): Promise<void>;
}

/** Stand-in for an SMTP provider: slow and occasionally flaky. */
export class ConsoleMailer implements Mailer {
  async send(email: Email): Promise<void> {
    await sleep(20);
    if (Math.random() < config.emailFailureRate) {
      throw new Error('SMTP timeout');
    }
    logger.info('email sent', { to: email.to, subject: email.subject });
  }
}
