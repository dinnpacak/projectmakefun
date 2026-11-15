// Round rules are independent of rendering so economy and objectives can be replayed.
export const STORE = Object.freeze({
  rifle: {cost:2700,mag:30,reserve:90},
  smg: {cost:1400,mag:36,reserve:108},
  shotgun: {cost:1900,mag:8,reserve:40},
});
export function createRound() {
  const state = {
    phase:'BUY', round:1, time:0, health:100, credits:2400,
    wins:0, losses:0, kills:0, planted:false, progress:0,
    selected:'rifle', reason:'Equip at the armory, then deploy.',
    buy(name) {
      const item=STORE[name];
      if(this.phase!=='BUY'||!item||this.credits<item.cost)return false;
      this.credits-=item.cost;
      this.selected=name;
      return true;
    },
    deploy() {
      if(this.phase!=='BUY')return;
      this.phase='LIVE';
      this.time=0;
      this.reason='Reach the west relay. Hold E for three seconds to arm.';
    },
    finish(won,reason) {
      if(this.phase==='ROUND_END')return;
      this.phase='ROUND_END';this.time=0;this.reason=reason;
      if(won){this.wins++;this.credits+=3250;}
      else {this.losses++;this.credits+=1900;}
    },
    hit(amount) {
      if(this.phase!=='LIVE'&&this.phase!=='PLANT')return;
      this.health=Math.max(0,this.health-amount);
      if(!this.health)this.finish(false,'Operator down. Reinforcements arrive next round.');
    },
    confirmKill() {
      this.kills++;
      this.credits+=300;
    },
    next() {
      if(this.phase!=='ROUND_END')return;
      this.round++;this.phase='BUY';this.time=0;this.health=100;
      this.planted=false;this.progress=0;
      this.reason='Resupply before the next deployment.';
    },
    tick(dt,active,{onSite=false,interact=false,clear=false}={}) {
      if(this.phase==='ROUND_END') {
        this.time+=dt;
        if(this.time>=4)this.next();
        return;
      }
      if(!active||this.phase==='BUY')return;
      this.time+=dt;
      if(clear){this.finish(true,'All hostile operators eliminated.');return;}
      if(!this.planted) {
        this.progress=onSite&&interact?Math.min(3,this.progress+dt):0;
        if(this.progress>=3) {
          this.planted=true;this.phase='PLANT';this.time=0;
          this.reason='Uplink armed. Hold the yard for 35 seconds.';
        }else if(this.time>=100)this.finish(false,'Deployment timer expired.');
      }else if(this.time>=35)this.finish(true,'Uplink complete. Sector secured.');
    },
  };
  return state;
}
