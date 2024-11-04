import { Component } from '@angular/core';
import { CctvService, ILogPing } from '../../../shareds/cctv.service';

@Component({
  selector: 'app-log-ping',
  templateUrl: './log-ping.component.html',
  styleUrl: './log-ping.component.css'
})
export class LogPingComponent {

  public logpingItems: ILogPing[] = [];

  constructor(private CctvSerivce: CctvService) {
    this.get_LogPing('1')
  }

  get_LogPing(id: any) {
    return this.CctvSerivce.get_logping(id)
      .subscribe(result => {
        this.logpingItems = result['result'];
        console.log(this.logpingItems)
      });
  }


}
