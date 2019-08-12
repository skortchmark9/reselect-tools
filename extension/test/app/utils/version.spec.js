import { expect } from 'chai';
import { greaterThan007 } from '../../../app/utils/version';


describe('version utils', () => {
  it('should do greater than 0.0.7 correctly', () => {
    expect(greaterThan007('0.0.8')).to.be.true;
    expect(greaterThan007('0.1.0')).to.be.true;
    expect(greaterThan007('1.0.0')).to.be.true;
    expect(greaterThan007(undefined)).to.be.false;
    expect(greaterThan007('0.0.7')).to.be.false;
    expect(greaterThan007('0.0.6')).to.be.false;
  });
});
