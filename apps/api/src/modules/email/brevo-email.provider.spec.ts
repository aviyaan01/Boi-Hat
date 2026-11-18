import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { BrevoEmailProvider } from './brevo-email.provider';

describe('BrevoEmailProvider', () => {
  let provider: BrevoEmailProvider;
  let configService: ConfigService;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrevoEmailProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'BREVO_API_KEY') return 'test-brevo-key-12345';
              if (key === 'BREVO_SENDER_EMAIL') return 'Boi-Hat <no-reply@boihat.com>';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<BrevoEmailProvider>(BrevoEmailProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('should successfully send email via HTTPS to Brevo API', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ messageId: '<test-msg-id-123@brevo.com>' }),
    });
    global.fetch = mockFetch as any;

    const result = await provider.sendEmail({
      to: 'buyer@example.com',
      subject: 'ভেরিফিকেশন কোড',
      htmlContent: '<p>123456</p>',
      textContent: '123456',
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'api-key': 'test-brevo-key-12345',
          'Content-Type': 'application/json',
        }),
      }),
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.sender.email).toBe('no-reply@boihat.com');
    expect(callBody.to[0].email).toBe('buyer@example.com');
  });

  it('should throw ServiceUnavailableException if API key is missing', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(null);
    delete process.env.BREVO_API_KEY;

    await expect(
      provider.sendEmail({
        to: 'buyer@example.com',
        subject: 'Test',
        htmlContent: '<p>Test</p>',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('should retry once on 5xx error and succeed if retry succeeds', async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => 'Bad Gateway',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ messageId: 'success-id' }),
      });
    global.fetch = mockFetch as any;

    const result = await provider.sendEmail({
      to: 'buyer@example.com',
      subject: 'Test Retry',
      htmlContent: '<p>Retry</p>',
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw ServiceUnavailableException if all retries fail with 5xx', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });
    global.fetch = mockFetch as any;

    await expect(
      provider.sendEmail({
        to: 'buyer@example.com',
        subject: 'Test Persistent Failure',
        htmlContent: '<p>Fail</p>',
      }),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
