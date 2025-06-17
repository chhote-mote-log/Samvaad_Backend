import * as debateService from '../../src/services/debateService';

describe('Debate Service', () => {
  it('should create a new debate', async () => {
    const mockInput = {
      topic: 'AI vs Human',
      type: 'professional',
    };
    const result = await debateService.createDebate(mockInput);
    
    expect(result).toHaveProperty('id');
    expect(result.topic).toBe('AI vs Human');
  });

  it('should list debates filtered by status', async () => {
    const result = await debateService.listDebates(1, 10, 'WAITING');
    expect(Array.isArray(result)).toBe(true);
  });
});
