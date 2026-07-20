import { describe, it, expect } from 'vitest';
import { 
    isCreator, 
    getPerspectiveRole, 
    getPerspectiveTitle, 
    getPerspectiveMetalClass, 
    getPerspectiveRupeeClass,
    getPerspectiveActionLabel,
    flipAction
} from './mutual-perspective.js';

describe('Mutual Perspective Engine', () => {
    
    const mockCreatorId = 'user-1';
    const mockPartnerId = 'user-2';
    
    const account = {
        creator_id: mockCreatorId,
        partner_id: mockPartnerId,
        creator_role: 'supplier',
        other_party_name: 'Bob the Partner',
        metal_class: 'receivable',
        rupee_class: 'payable'
    };

    describe('isCreator', () => {
        it('identifies the creator correctly', () => {
            expect(isCreator(account, mockCreatorId)).toBe(true);
            expect(isCreator(account, mockPartnerId)).toBe(false);
        });
    });

    describe('getPerspectiveRole', () => {
        it('returns creator role for creator', () => {
            expect(getPerspectiveRole(account, mockCreatorId)).toBe('supplier');
        });
        it('returns inverted role for partner', () => {
            expect(getPerspectiveRole(account, mockPartnerId)).toBe('trade_customer');
        });
    });

    describe('getPerspectiveTitle', () => {
        it('returns other_party_name for creator', () => {
            expect(getPerspectiveTitle(account, mockCreatorId)).toBe('Bob the Partner');
        });
        it('returns "Creator Account" fallback for partner since creator_alias was removed', () => {
            expect(getPerspectiveTitle(account, mockPartnerId)).toBe('Creator Account');
        });
    });

    describe('getPerspectiveMetalClass', () => {
        it('returns canonical class for creator', () => {
            expect(getPerspectiveMetalClass(account, mockCreatorId)).toBe('receivable');
        });
        it('returns inverted class for partner', () => {
            expect(getPerspectiveMetalClass(account, mockPartnerId)).toBe('payable');
        });
    });

    describe('getPerspectiveRupeeClass', () => {
        it('returns canonical class for creator', () => {
            expect(getPerspectiveRupeeClass(account, mockCreatorId)).toBe('payable');
        });
        it('returns inverted class for partner', () => {
            expect(getPerspectiveRupeeClass(account, mockPartnerId)).toBe('receivable');
        });
    });

    describe('getPerspectiveActionLabel', () => {
        it('returns canonical label for creator', () => {
            expect(getPerspectiveActionLabel('increase_receivable', true)).toBe('Increase Receivable');
            expect(getPerspectiveActionLabel('decrease_payable', true)).toBe('Decrease Payable');
        });
        it('returns inverted label for partner', () => {
            expect(getPerspectiveActionLabel('increase_receivable', false)).toBe('Increase Payable');
            expect(getPerspectiveActionLabel('decrease_payable', false)).toBe('Decrease Receivable');
        });
    });

    describe('flipAction', () => {
        it('flips actions correctly', () => {
            expect(flipAction('increase_receivable')).toBe('increase_payable');
            expect(flipAction('decrease_payable')).toBe('decrease_receivable');
        });
    });

});
